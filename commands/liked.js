const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require("axios")
const play = require('play-dl')
const ytsr = require('scrape-youtube');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('liked')
        .setDescription('Temporary command to test what the queue command should look like?'),
    async execute(interaction) {
        console.log("AAA")
        var { queues, updateQueue, discordTokens, tokens, getSpotifyAccessToken, clearQueue, addToQueue } = require("../index.js")
        var queue = queues[interaction.guild.id]

        var discordLogin = discordTokens[interaction.member.id]

        if (discordLogin) {
            console.log("LOGGED INTO DISCORD")
            console.log(discordLogin.spotifyId)

            var spotifyLogin = tokens[discordLogin.spotifyId]
            if (spotifyLogin) {
                console.log("SPOTIFY")
                console.log(spotifyLogin)
                var spotifyAccessToken = await getSpotifyAccessToken(discordLogin.spotifyId)
                console.log(spotifyAccessToken)

                try {

                    var tracks = await getSpotifyLikedSongs(await getSpotifyAccessToken(discordLogin.spotifyId))

                    async function getSpotifyLikedSongs(accessToken) {
                        var next = `https://api.spotify.com/v1/me/tracks?offset=0&limit=50`
                        var offset = 0
                        var tracks = []
                        /* do {
                            var data = (await axios.get(next, {
                                headers: {
                                    authorization: "Bearer " + (accessToken)
                                }
                            })).data
                            next = data.next
                            tracks = tracks.concat(data.items)
                            offset += 50
                            console.log(`Fetching Playlist: ${offset/data.total*100}%`)
                        } while (next); */

                        var data = (await axios.get(next, {
                            headers: {
                                authorization: "Bearer " + (accessToken)
                            }
                        })).data

                        var downloaders = []

                        for (let index = 0; index < Math.ceil(data.total/50); index++) {
                            downloaders.push(axios.get(`https://api.spotify.com/v1/me/tracks?offset=${index*50}&limit=50`, {
                                headers: {
                                    authorization: "Bearer " + (accessToken)
                                }
                            }))
                        }

                        var requests = await Promise.all(downloaders)

                        requests.forEach(request=>{
                            tracks = tracks.concat(request.data.items)
                        })

                        return tracks
                    }


                    console.log(tracks.at(-1))
                    clearQueue(interaction.guild.id)

                    //tracks = [tracks[244]]

                    //var firstSong = tracks.shift()

                    var promises = []


                    var processedSongNum = 0
                    

                    tracks.forEach(async (item, index) => {
                        promises.push(async function () {
                            //console.log(item.track.name)
                            
                            try {
                                let res = await play.video_basic_info((await ytsr.search(item.track.name + " " + item.track.artists.map(a => a.name).join(" "))).videos[0].link)
                                console.log(item.track.name + " " + item.track.artists.map(a => a.name).join(" "))
                                if (res == null || !res) return;
                                res = res.video_details
                                ///console.log("RES:")
                                //console.log(index)
                                console.log("Found: " + item.track.name)
                            res.title = item.track.name
                                res.image = item.track.album.images[0].url
                                res.spotifyUrl = item.track.external_urls.spotify
                               res.authors = item.track.artists
                               res.images = item.track.album.images
                               // console.log("QUEUE SUB SONG")
                                addToQueue(res, interaction.guild.id, interaction.member.id)
                            } catch (error) {
                                console.log(error)
                            }
                            processedSongNum++
                            console.log(processedSongNum)
                            if (processedSongNum % 50 == 0) {
                                console.log("UPDATE QUEUE")
                                updateQueue(interaction.guild.id)
                            }
                        })
                    })

                    var downloaderNum = 0

                    async function nextSong() {
                        var downloader = promises.pop()
                        if (!downloader) {
                            console.log(`[${downloaderNum}] REACHED END OF DOWNLOADS!`)
                            downloaderNum++
                            return;
                        }
                        await downloader()
                        await new Promise((resolve) =>setTimeout(resolve, 1000))
                        await nextSong()
                    }

                    var batch = []
                    for (let index = 0; index < 50; index++) {
                        batch.push(nextSong())
                        //batch.push(nextSong())
                        //updateQueue(interaction.guild.id)
                    }

                    console.log("PROMISES:")
                    console.log(promises)
                    //await Promise.all(promises)

                    console.log(batch)

                    await Promise.all(batch)
                    console.log("WAITED!")
                    updateQueue(interaction.guild.id)


                } catch (error) {
                    console.log(error)
                    console.log(error.response.data)
                }



            }
        }

    }
}