const { SlashCommandBuilder } = require('@discordjs/builders');
const { EndBehaviorType, createAudioPlayer, joinVoiceChannel, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl')
const ytsr = require('scrape-youtube');

const ytpl = require('ytpl');

const youtubeRegex = /^((?:https?:)?\/\/)?((?:www|music)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/

const spotifyRegex = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:(track|playlist|artist|episode|album)\/)((?:\w|-){22})/

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Requests a song to play on the musicbot.')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('Enter a valid url or search term!')
                .setRequired(true)),
    async execute(interaction) {
        var input = interaction.options.getString('input')
        console.log(input)

        var promises = []
        

        const { addToQueue, queues, getSpotifyPlaylist, getSpotifySong, getSpotifyAlbum, updateQueue } = require("../index")


        if (!interaction.member.voice?.channel) return interaction.channel.send('Connect to a Voice Channel')



        const voiceConnection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator
        })

        const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
            const newUdp = Reflect.get(newNetworkState, 'udp');
            clearInterval(newUdp?.keepAliveInterval);
        }
        voiceConnection.on('stateChange', (oldState, newState) => {
            Reflect.get(oldState, 'networking')?.off('stateChange', networkStateChangeHandler);
            Reflect.get(newState, 'networking')?.on('stateChange', networkStateChangeHandler);
        });

        var stream;

        var seconds;

        var details

        interaction.deferReply();

        if (input.startsWith("https://music.youtube.com/playlist")) {
            console.log("YOUTUBE MUSIC PLAYLOIST!")
            var playlist = await ytpl(input);
            var items = playlist.items

            items.forEach(async (item, index) => {
                if (index == 0) {
                    details = item
                    console.log("PLAY FIRST SONG")
                } else {
                    console.log("QUEUE SUB SONG")
                    addToQueue(item, interaction.guild.id)
                    console.log("QUEUE SUB SONG")
                }
            })

        } else if (input.match(youtubeRegex)) {
            details = (await play.video_basic_info(input)).video_details
        } else if (input.match(spotifyRegex)) {
            var type = input.match(spotifyRegex)[1]
            var id = input.match(spotifyRegex)[2]

            if (type == "track") {
                console.log("Spotify Song!")
                console.log(input)
                let sresult = (await getSpotifySong(id)).data
                console.log(sresult)

                let res = await play.video_basic_info((await ytsr.search(sresult.name + " " + sresult.artists.map(a => a.name).join(" "))).videos[0].link)
                if (res == null || !res) return;
                res = res.video_details
                console.log("Found: " + sresult.name)
                res.title = sresult.name
                res.image = sresult.album.images[0].url
                res.spotifyUrl = sresult.external_urls.spotify
                res.author = sresult.artists.map(a => a.name).join(" ")
                if (res.duration) res.duration = hmsToSecondsOnly(res.duration)
                details = res


            } else if (type == "playlist") {
                console.log("Spotify Playlist!")
                console.time('Fetch Spotify Playlist')
                let spotifyRes = await getSpotifyPlaylist(id)
                console.timeEnd('Fetch Spotify Playlist')

                /* for (let index = 0; index < spotifyRes.data.tracks.items.length; index++) { */
                /* var item = spotifyRes.data.tracks.items[index] */
                spotifyRes.data.tracks.items.forEach(async (item, index) => {
                    promises.push(async function () {
                        try {
                            var link = (await ytsr.search(item.track.name + " " + item.track.artists.map(a => a.name).join(" "))).videos?.[0]?.link
                            if (!link) return
                            console.log(link)
                            let res = await play.video_basic_info(link)
                            if (res == null || !res) return;
                            res = res.video_details
                            console.log("RES:")
                            //console.log(res)
                            console.log("Found: " + item.track.name)
                            res.title = item.track.name
                            res.image = item.track.album.images[0].url
                            res.spotifyUrl = item.track.external_urls.spotify
                            res.author = item.track.artists.map(a => a.name).join(" ")
                            if (res.duration) res.duration = hmsToSecondsOnly(res.duration)
                            if (index == 0) {
                                details = res
                                console.log("PLAY FIRST SONG")
                            } else {
                                console.log("QUEUE SUB SONG")
                                addToQueue(res, interaction.guild.id)
                                console.log("QUEUE SUB SONG")
                            }
                        } catch (error) {
                            console.log(error)
                        }


                    })
                })
                console.log("PROMISES:")
                console.log(promises)
                await promises.shift()()
                await Promise.all(promises)
                console.log("WAITED!")
            } else if (type == "artist") {
                console.log("Spotify Artist!")
                await getSpotifyArtist(id).then(res => {
                    for (let index = 0; index < res.data.tracks.length; index++) {
                        var item = res.data.tracks[index]
                        promises.push(searchSong(item))
                        async function searchSong(item) {
                            await youtubeSearch(item.name + " " + item.artists.map(a => a.name).join(" ")).then(res => {
                                res.duration = hmsToSecondsOnly(res.duration)
                                res.title = item.name
                                res.image = item.album.images[0].url
                                res.spotifyUrl = item.external_urls.spotify
                                result.push(res)

                            })
                        }
                    }
                })

            } else if (type == "album") {
                console.log("Spotify Album!")
                let spotifyRes = await getSpotifyAlbum(id)

                console.log(spotifyRes.data.tracks.items)


                spotifyRes.data.tracks.items.forEach(async (item, index) => {
                    console.log(item)
                    promises.push(async function () {
                        let res = await play.video_basic_info((await ytsr.search(item.name + " " + item.artists.map(a => a.name).join(" "))).videos[0].link)
                        if (res == null || !res) return;
                        res = res.video_details
                        console.log("RES:")
                        //console.log(res)
                        console.log("Found: " + item.name)
                        res.title = item.name
                        /* res.image = item.album.images[0].url */
                        res.spotifyUrl = item.external_urls.spotify
                        res.author = item.artists.map(a => a.name).join(" ")
                        if (res.duration) res.duration = hmsToSecondsOnly(res.duration)
                        if (index == 0) {
                            details = res
                            console.log("PLAY FIRST SONG")
                        } else {
                            console.log("QUEUE SUB SONG")
                            addToQueue(res, interaction.guild.id)
                            console.log("QUEUE SUB SONG")
                        }

                    })
                })

                console.log("PROMISES:")
                console.log(promises)
                await promises.shift()()
                console.log("WAITED!")

                /* for (let index = 0; index < Albumres.data.tracks.items.length; index++) {
                    var item = Albumres.data.tracks.items[index]
                    promises.push(searchSong(item))
                    async function searchSong(item) {
                        //await youtubeSearch(item.name + " " + item.artists.map(a => a.name).join(" ")).then(res => {
                        await play.video_basic_info((await ytsr.search(item.name + " " + item.artists.map(a => a.name).join(" "))).videos[0].link).then(res => {
                            if (!result) return;
                            console.log(Albumres.data)
                            res.title = item.name
                            res.image = Albumres.data.images[0].url
                            res.spotifyUrl = item.external_urls.spotify
                            result.push(res)
                        })


                    }
                } */

            }
        } else {
            details = (await play.video_basic_info((await ytsr.search(input)).videos[0].link)).video_details;
        }

        console.log(promises)

        console.log(details)

        //details = details.video_details

        console.log(details)

        addToQueue(details, interaction.guild.id)

        var serverQueue = queues[interaction.guild.id]

        if (serverQueue.queue.length > 1) {
            interaction.editReply(`Adding to the queue! (${serverQueue.queue.length})`)
        } else {
            interaction.editReply("Playing!")
        }

        setTimeout(async () => {
            /* for (const promise of promises) {
                await promise()
            } */

            async function nextSong() {
                var downloader = promises.pop()
                if (!downloader) return;
                await downloader()
                nextSong()
            }

            var batch = []
            for (let index = 0; index < 100; index++) {
                batch.push(nextSong())
            }

            await Promise.all(batch)

            console.log("Done Waiting!")

            updateQueue(interaction.guild.id)

        }, 1000);

        updateQueue(interaction.guild.id)

    }

}