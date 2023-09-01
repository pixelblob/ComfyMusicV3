const WebSocket = require('ws');
const axios = require("axios")
const play = require('play-dl')
const ytsr = require('scrape-youtube');
const NodeCache = require("node-cache");

const ffmpeg = require('fluent-ffmpeg');
const fs = require("fs")

const ytdl = require('ytdl-core');

const path = require('path');

const COOKIE = 'YSC=rw_b3hdNTuo; VISITOR_INFO1_LIVE=cEt1mxY9FiA; LOGIN_INFO=AFmmF2swRgIhAOZefOIiPaMTdpp81pe6w8WHN6nZK3OjorKzW4KMvVdUAiEAwzEzF8Bj3-h_3nJJ9U6qVOLfycdlRXa9qGMY5wWejRE:QUQ3MjNmektfdEJSSmdlVEJxeUQzV3pRUlgtMGlTSXRtOTNDVjlQeFhMQzJKWnIycVFCanlNaElhLUFRamR0VVQxMlh0YVZjTXVpWTNkTkZlTC1KTXg4SFdZVlpLdkt6Y1Z6U0NHODVZYjJ0MlBtVzcwZFlncUstdDZxd3R0YmdlNFMydEVzNW4wekhZTl9RQ1ZVWWJWV1Jld0RmWk1RM1B3; DevTools=0; _gcl_au=1.1.1058259504.1689205543; SID=ZgivZF-QlJbpKAh6RciSBQiWuW-5_mPi2kcUK33WzfxToe7uN-61seQ_if0pAmNOFS89Ow.; __Secure-1PSID=ZgivZF-QlJbpKAh6RciSBQiWuW-5_mPi2kcUK33WzfxToe7u_F4-5-b0Wakq2Y5FBN8BUw.; __Secure-3PSID=ZgivZF-QlJbpKAh6RciSBQiWuW-5_mPi2kcUK33WzfxToe7u2see4D290UPRr3a_68V65w.; HSID=AY0lnXOWge2oH-S56; SSID=AIk5GzkGeA4rFaiHq; APISID=Da52KYPI_BEqhr-y/A9Z9q0iQOwxAuaNFX; SAPISID=op7Kagbl5iP31w3G/AKdmBAXFjsZEQdBvu; __Secure-1PAPISID=op7Kagbl5iP31w3G/AKdmBAXFjsZEQdBvu; __Secure-3PAPISID=op7Kagbl5iP31w3G/AKdmBAXFjsZEQdBvu; PREF=f6=40000000&tz=Africa.Johannesburg&f7=100&autoplay=true&volume=5&f5=30000; VISITOR_PRIVACY_METADATA=CgJaQRICGgA%3D; wide=1; __Secure-1PSIDTS=sidts-CjEBSAxbGbzYAR118C-hc_knMzNpNKYL9f7WMm49ClhIWEkg8QrM4rGZ-JJvp9lMS24vEAA; __Secure-3PSIDTS=sidts-CjEBSAxbGbzYAR118C-hc_knMzNpNKYL9f7WMm49ClhIWEkg8QrM4rGZ-JJvp9lMS24vEAA; SIDCC=APoG2W_nVm8jmjU0OA338PdxMAu30ygAJ7tet3tA_9SYJJzqkbbNwkC6Tdibhs7JY_Fwn7xVpKA; __Secure-1PSIDCC=APoG2W_rKAfoB43PN2kE8I2y5YqL8OgkjpxruiatDnUlOxMzBp22-BMqdUm4SCYF1NHrOsZtO6IM; __Secure-3PSIDCC=APoG2W_mcGEYCtXMOuDb-lruP3smsGI7GiJ06FyYWqeBh6shPwa6iJ6qcNdDvWVIAo9XXqBLnrQ';

var cloneable = require('cloneable-readable')

const PassThrough = require('stream').PassThrough;

const { Transform } = require('stream');


const { EndBehaviorType, createAudioPlayer, joinVoiceChannel, createAudioResource, NoSubscriberBehavior, getVoiceConnection } = require('@discordjs/voice');
const e = require('express');

const exclude = ["official video", "official music video", "official hd video", "video"]

const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./links.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected!');
});

var clients = []

module.exports = {
    name: 'voiceStateUpdate',
    once: false,
    async execute(oldState, newState, start) {
        var { tokens, sessions, discordTokens, getSpotifyAccessToken, client, queues, io, updateQueue, getDiscordUser, getSpotifyUser } = require("../index.js")
        var oldChannel = oldState.channel
        var newChannel = newState.channel

        function disconnectSpotify() {
            queues[newState.guild.id].spotifyUser = null
            queues[newState.guild.id].current = null

            var { queue, currentIndex } = queues[newState.guild.id]

            io.sockets.emit('queueUpdate', { queue, currentIndex })
        }


        const blackListedWords = ["official video", "official music video", "official hd video", "video"]

        if (newChannel != oldChannel && newChannel) {
            console.log("User Join Voice!")

            const spotifyUser = await getSpotifyUser({ discordId: newState.id })

            if (!spotifyUser) return

            console.log(spotifyUser)
            console.log("SPOTIFYUSER: " + newState.member.user.username)
            //return
            connectToClientWebsocket()

            async function connectToClientWebsocket() {
                var member = newState.guild.members.cache.get(newState.id)
                //console.log(member.user.username, (await getSpotifyAccessToken(spotifyUser.spotifyId)))
                const ws = new WebSocket('wss://gew1-dealer.spotify.com/?access_token=' + (await getSpotifyAccessToken(spotifyUser.spotifyId)))

                ws.on("error", async error => {
                    console.log(error)
                })

                ws.on("open", () => {
                    ws.send(JSON.stringify({ "type": "ping" }))
                })

                async function getYoutubeEquivalent(title, originalLength) {
                    console.time("SEARCHING FOR SONG")
                    const searchResults = await ytsr.search(title)
                    blackListedWords.forEach(bw => {
                        searchResults.videos = searchResults.videos.filter(r => !r.title.toLowerCase().includes(bw))
                    })

                    searchResults.videos.filter(v => Math.abs(v.duration - originalLength) < 5)

                    console.timeEnd("SEARCHING FOR SONG")
                    return searchResults.videos[0]
                }

                var player
                var connection
                var active = false

                var oldMetadata

                var youtubeUrl

                var seqNum

                var paused

                var shufflingContext
                var repeatingContext
                var repeatingTrack

                var stream

                ws.addEventListener('message', async event => {
                    let json = event.data;
                    json = JSON.parse(json);
                    if (json.type == "message") {

                        console.log("MESSAGE:")
                        console.log(JSON.stringify(json))

                        if (json.headers["Spotify-Connection-Id"]) {  //REGISTER AS SPEAKER TO CLIENT

                            console.log("PLEASE REGISTER TO CLIENT!")

                            let data = (await axios.post("https://api.spotify.com/v1/track-playback/v1/devices", {
                                "device": {
                                    "brand": "spotify",
                                    "capabilities": {
                                        "change_volume": false,
                                        "enable_play_token": false,
                                        "supports_file_media_type": false,
                                        "play_token_lost_behavior": "pause",
                                        "disable_connect": false,
                                        "audio_podcasts": false,
                                        "video_playback": false,
                                        "manifest_formats": [
                                            "file_ids_mp3",
                                            "file_urls_mp3",
                                            "manifest_ids_video",
                                            "file_urls_external",
                                            "file_ids_mp4",
                                            "file_ids_mp4_dual"
                                        ]
                                    },
                                    "device_id": "4de316d68694cfd8b81163fcfbaa739cd129a04g",
                                    "device_type": "audio_dongle",
                                    "metadata": {},
                                    "model": "web_player",
                                    "name": "Comfy Music",
                                    "platform_identifier": "web_player windows 10;chrome 102.0.5005.63;desktop",
                                    "is_group": false
                                },
                                "outro_endcontent_snooping": false,
                                "connection_id": json.headers["Spotify-Connection-Id"],
                                "client_version": "harmony:4.24.0-ed6fca3"
                            }, {
                                headers: {
                                    authorization: "Bearer " + ((await getSpotifyAccessToken(spotifyUser.spotifyId)))
                                }
                            })).data

                            //console.log(data)
                            seqNum = data["initial_seq_num"]

                        } else if (json.payloads[0].type == "replace_state") {   //CLIENT REQUESTING CONNECTION TO SERVER
                            console.log("CHANGE STATE")
                            var state_machine = json.payloads[0].state_machine
                            var state_ref = json.payloads[0].state_ref
                            var prev_state_ref = json.payloads[0].prev_state_ref

                            //console.log(state_machine)

                            console.log("CHECKING FOR ALREADY CONNECTED CLIENTS!")

                            var client = clients.filter(c => c.discordId != newState.id).find(c => c.active == true)

                            if (client) {
                                console.log("FOUND CONNECTED CLIENT! PLEASE DISCONNECT THEM")

                                console.log("DISCONNECTINMG: " + newState.member.user.username)

                                client.disconnect(true)

                            } else {
                                console.log("No Preexisting clients found!")
                            }


                            if (!state_ref && json.payloads[0]?.prev_state_ref) {
                                console.log("DISCONNECT?!")

                                disconnect(true)

                                return console.log("NO STATEREF!")
                            }

                            if (!state_ref) {
                                return console.log("NO STATE REF!")
                            }

                            var metadata = state_machine.tracks[state_machine.states[state_ref.state_index].track].metadata

                            //console.log(metadata)

                            queues[newState.guild.id].current = metadata

                            //console.log("QUEUE:")

                            //console.log("UPDATE SPEAKER INITIAL")
                            /* await axios.put("https://api.spotify.com/v1/track-playback/v1/devices/4de316d68694cfd8b81163fcfbaa739cd129a04g/state", {
                                "seq_num": seqNum,
                                "state_ref": {
                                    "state_machine_id": state_machine.state_machine_id,
                                    "state_id": state_machine.states[state_ref.state_index].state_id,
                                    "paused": paused || false
                                },
                                "sub_state": {
                                    "playback_speed": 1,
                                    "position": json.payloads[0].seek_to,
                                    "duration": metadata.duration,
                                    "media_type": "AUDIO",
                                    "bitrate": 256000,
                                    "audio_quality": "VERY_HIGH",
                                    "format": 11
                                }
                            }, {
                                headers: {
                                    authorization: "Bearer " + (await getSpotifyAccessToken(spotifyUser.spotifyId))
                                }
                            }) */

                            //console.log("SKIPPING UPDATE SPEAKER INITIAL!")

                            var client = clients.find(c => c.discordId == newState.id)

                            if (!client) {
                                clients.push({ active: true, spotifyId: spotifyUser.spotifyId, discordId: newState.id, disconnect: disconnect })
                            } else {
                                client.active = true
                                client.disconnect = disconnect
                            }



                            active = true

                            console.log("CLIENTS:")
                            //console.log(clients)
                            console.log(clients.length)



                            var member = newState.guild.members.cache.get(newState.id)

                            async function playURL(url) {
                                console.time("PLAY SONG")
                                var options = {}

                                if (json.payloads[0].seek_to !== null) options.seek = json.payloads[0].seek_to / 1000

                                if (player) player.removeAllListeners("stateChange")

                                if (!player) {
                                    player = createAudioPlayer({
                                        behaviors: { noSubscriber: NoSubscriberBehavior.Play }
                                    })
                                    player.on("error", err => {
                                        console.log(err)
                                    })
                                }

                                queues[newState.guild.id].player = player

                                var resource

                                try {


                                    var youtubeRegex = /^((?:https?:)?\/\/)?((?:www|music)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/
                                    var id = url.match(youtubeRegex)[5]
                                    console.log(url, id)



                                    if (!fs.existsSync(`./songCache/${id}.mp3`)) {
                                        console.log("GET STREAM 1")
                                        stream = await play.stream(url, options)

                                        cacheSongFile(id)

                                        resource = createAudioResource(stream.stream, { inputType: stream.type });
                                    } else {
                                        let editedSong = ffmpeg({ source: `./songCache/${id}.mp3` })/* .outputOptions("-af bass=g=5") */.toFormat('mp3').setStartTime(Math.ceil(json.payloads[0].seek_to / 1000))
                                        resource = createAudioResource(editedSong);
                                    }



                                    console.log(`PLAYING SONG AT ${json.payloads[0].seek_to / 1000}s`)

                                    player.play(resource)
                                    connection.subscribe(player)

                                    player["_state"].resource.playbackDuration += json.payloads[0].seek_to

                                } catch (error) {
                                    console.log(error)
                                    skipNext()
                                }

                                async function skipNext() {
                                    var nxtStateInex = state_machine.states[state_ref.state_index].transitions.skip_next.state_index
                                    var metadata = state_machine.tracks[state_machine.states[nxtStateInex].track].metadata

                                    oldMetadata = metadata
                                    queues[newState.guild.id].current = metadata

                                    console.log("NEXT METADATA")
                                    console.log(`Playing ${metadata.name} by ${metadata.authors[0].name} Next!`)

                                    var ytVideo = await getYoutubeEquivalent(metadata.name + " " + metadata.authors.map(a => a.name).join(" "), metadata.duration / 1000)

                                    console.log(ytVideo.link)

                                    json.payloads[0].seek_to = null

                                    let data = (await axios.put("https://api.spotify.com/v1/track-playback/v1/devices/4de316d68694cfd8b81163fcfbaa739cd129a04g/state", {
                                        "seq_num": seqNum,
                                        "state_ref": {
                                            "state_machine_id": state_machine.state_machine_id,
                                            "state_id": state_machine.states[nxtStateInex].state_id,
                                            "paused": paused || false
                                        },
                                        "sub_state": {
                                            "playback_speed": 1,
                                            "position": 0,
                                            "duration": metadata.duration,
                                            "media_type": "AUDIO",
                                            "bitrate": 256000,
                                            "audio_quality": "VERY_HIGH",
                                            "format": 11
                                        }
                                    }, {
                                        headers: {
                                            authorization: "Bearer " + (await getSpotifyAccessToken(spotifyUser.spotifyId))
                                        }
                                    })).data

                                    //console.log("NEW DATA")

                                    //console.log(data)

                                    //console.log("OLD SATE MACHINES", state_machine)

                                    //console.log("NEW SATE MACHINES", data.state_machine)

                                    state_machine = data.state_machine

                                    prev_state_ref = state_ref

                                    state_ref = data.updated_state_ref

                                    //MIGHT NEED TO UPDATE PREV STATE REF HERE IDK



                                    await playURL(ytVideo.link)

                                }

                                player.on("stateChange", async (oldState, newState) => {
                                    console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
                                    if (newState.status == "idle") {

                                        //console.log(state_machine.states[state_machine.states[state_ref.state_index].transitions.skip_next.state_index].state_id)

                                        skipNext()

                                    }
                                })
                                console.timeEnd("PLAY SONG")
                            }

                            var { shuffling_context, repeating_context, repeating_track } = state_machine.attributes.options

                            if (/* paused != state_ref.paused && paused !== undefined */state_ref.paused != prev_state_ref?.paused && paused !== undefined) {
                                console.log("PAUSE STATE CHANGED!")
                                paused = state_ref.paused

                                if (paused) {
                                    player?.pause?.()
                                } else {
                                    player?.unpause?.()
                                }


                                /* axios.post("https://gew1-spclient.spotify.com/connect-state/v1/player/command/from/46e0fe12e36f124aa4a07126732c47e03e2e3073/to/4de316d68694cfd8b81163fcfbaa739cd129a04g", {
                                    "command": { "endpoint": paused ? "resume" : "pause" }
                                }, {
                                    headers: {
                                        authorization: "Bearer " + ((await getSpotifyAccessToken(spotifyUser.spotifyId)))
                                    }
                                })
                                    .then(function (response) {
                                        console.log(response.data)
                                        seqNum = response.data["initial_seq_num"]

                                    })
                                    .catch(function (error) {
                                        console.log(error.response.data);
                                    }); */


                            } else if (json.payloads[0].seek_to !== null && oldMetadata?.uri == metadata.uri) {
                                console.time("------- SEEKING -------")
                                await playURL(youtubeUrl)

                                console.timeEnd("------- SEEKING -------")
                            } else if (oldMetadata?.uri != metadata.uri) {
                                console.log(" HAVE TO CHANGE SONG! ")
                                console.log(oldMetadata?.uri, metadata.uri)
                                updateQueue(newState.guild.id)
                                connection = getVoiceConnection({
                                    guildId: member.guild.id,
                                })
                                if (!connection) {
                                    connection = joinVoiceChannel({
                                        channelId: member.voice.channel.id,
                                        guildId: member.guild.id,
                                        adapterCreator: member.guild.voiceAdapterCreator
                                    })

                                    //    \/ Dont think I need this anymore apparently it was fixed \/
                                    /* const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
                                        const newUdp = Reflect.get(newNetworkState, 'udp');
                                        clearInterval(newUdp?.keepAliveInterval);
                                    }
                                    connection.on('stateChange', (oldState, newState) => {
                                        Reflect.get(oldState, 'networking')?.off('stateChange', networkStateChangeHandler);
                                        Reflect.get(newState, 'networking')?.on('stateChange', networkStateChangeHandler);
                                    }); */
                                }

                                cachenxtsong()

                                var spotifyId = metadata.uri.split(":").at(-1)

                                var ytId = await getLink(spotifyId) || (await getYoutubeEquivalent(metadata.name + " " + metadata.authors.map(a => a.name).join(" "), metadata.duration / 1000)).id

                                createLink(spotifyId, ytId)

                                youtubeUrl = `https://www.youtube.com/watch?v=${ytId}`
                                metadata.url = youtubeUrl

                                await playURL(youtubeUrl)

                                paused = false
                            } else {
                                console.log("UNKNOWN EVENT!", JSON.stringify(json))
                            }

                            async function cachenxtsong() {
                                console.log("CACHE NEXT SONG!")
                                var nxtStateInex = state_machine.states[state_ref.state_index].transitions.skip_next.state_index
                                var nxtMetadata = state_machine.tracks[state_machine.states[nxtStateInex].track].metadata

                                console.log("Next will be:",nxtMetadata.name)

                                var spotifyId = nxtMetadata.uri.split(":").at(-1)

                                var ytId = await getLink(spotifyId) || (await getYoutubeEquivalent(nxtMetadata.name + " " + nxtMetadata.authors.map(a => a.name).join(" "), nxtMetadata.duration / 1000)).id

                                createLink(spotifyId, ytId)

                                cacheSongFile(ytId)
                            }

                            if (shuffling_context != shufflingContext) {
                                console.log("shuffling state changed!")



                            } else if (repeating_context != repeatingContext) {
                                console.log("repeatingctx state changed!")

                            } else if (repeating_track != repeatingTrack) {
                                console.log("repeatingtrk state changed!")

                            }

                            shufflingContext = shuffling_context
                            repeatingContext = repeating_context
                            repeatingTrack = repeating_track

                            console.log(paused)

                            console.log(json.payloads[0].seek_to, player["_state"].resource.playbackDuration)


                            console.log("UPDATE SPEAKER POST")
                            await axios.put("https://api.spotify.com/v1/track-playback/v1/devices/4de316d68694cfd8b81163fcfbaa739cd129a04g/state", {
                                "seq_num": seqNum,
                                "state_ref": {
                                    "state_machine_id": state_machine.state_machine_id,
                                    "state_id": state_machine.states[state_ref.state_index].state_id,
                                    "paused": paused || false
                                },
                                "sub_state": {
                                    "playback_speed": 1,
                                    "position": json.payloads[0].seek_to || player["_state"].resource.playbackDuration,
                                    "duration": metadata.duration,
                                    "media_type": "AUDIO",
                                    "bitrate": 256000,
                                    "audio_quality": "VERY_HIGH",
                                    "format": 11
                                }
                            }, {
                                headers: {
                                    authorization: "Bearer " + (await getSpotifyAccessToken(spotifyUser.spotifyId))
                                }
                            })


                            //console.log("UPDATING OLD METADATA")
                            oldMetadata = metadata


                            queues[newState.guild.id].current = metadata

                            var sendQueue = {}
                            Object.values(queues).forEach((queue, index) => {
                                var { queue, current, currentIndex } = queue
                                sendQueue[Object.keys(queues)[index]] = { queue, current, currentIndex }
                            })
                            io.sockets.emit('queueUpdate', sendQueue)

                            return;

                        } else if (json.payloads[0].reason == "SESSION_DELETED") {
                            //console.log("CLIENT HAS DISCONENCTED!")
                            //disconnect(true)
                            console.log("CLIENT USED TO DISCONNECT HERE HE DOESNT ANYMORE, IF SOMETHING BAD HAPPENS PLS DEBUG HERE!")
                        } else if (json.uri.startsWith("hm://collection/collection/")) {
                            if (json.uri.endsWith("json")) {
                                console.log("COLLECTION HAS BEEN MODIFIED!")
                                var payload = JSON.parse(json.payloads[0])
                                console.log(payload)
                            }
                        } else {
                            //console.log(JSON.stringify(json))
                        }

                    } else if (json.type == "pong") {
                        //console.log("RECIEVED PONG!")
                        setTimeout(() => {
                            //console.log("SENT PING!")
                            ws.send(JSON.stringify({ "type": "ping" }))
                        }, 15000);
                    } else {
                        console.log("UNKNOWN JSON TYPE!")
                    }
                })

                var listener = async (oldState2, newState2) => {
                    var oldChannel = oldState2.channel
                    var newChannel = newState2.channel
                    if (newChannel != oldChannel && oldChannel) {
                        console.log("LEAVE")
                        if (newState2.id == newState.id) {
                            console.log("Spotify User Leave Voice!")

                            console.log("ACTIVE: " + active)

                            disconnect(false)

                            active = false
                        }
                    }
                }

                async function disconnect(reconnect) {
                    ws.close()

                    if (player) {
                        player.removeAllListeners("stateChange")
                    }

                    try {
                        if (player) player.stop();
                        connection?.destroy?.()
                    } catch (error) {
                        console.log(error)
                    }

                    active = false

                    console.log("Disconnecting Client Properly (For The Most Part Lol): ")
                    var client = clients.find(c => c.active == true)
                    if (client) client.active = false

                    disconnectSpotify()

                    if (reconnect) {
                        connectToClientWebsocket()
                    }

                }

                async function cacheSongFile(id) {
                    console.log("Attempting To Cache:", id)
                    if (fs.existsSync(`./songCache/${id}.mp3`)) return console.log(id, "Has already been cached!")
                    if (fs.existsSync(`./songCache/temp/${id}.mp3`)) return console.log(id, "Is in the process of being cached!")
                    let stream2 = ytdl(id, {
                        quality: 'highestaudio',
                        requestOptions: {
                            headers: {
                                cookie: COOKIE
                            }
                        }
                    });

                    await new Promise((resolve, reject) => {
                        let start = Date.now();
                        let output = `./songCache/temp/${id}.mp3`
                        fs.mkdirSync(path.dirname(output), { recursive: true });
                        ffmpeg(stream2)
                            .audioBitrate(128)
                            .save(output)
                            .on('end', () => {
                                console.log(`Finished Downloading ${id} after ${(Date.now() - start) / 1000}s`);
                                try {
                                    fs.renameSync(output, `./songCache/${id}.mp3`)
                                } catch (error) {

                                }
                                resolve()
                            });
                    })
                }

                client.on("voiceStateUpdate", listener)
            }

        } else if (newChannel != oldChannel && oldChannel) {
            console.log("User Leave Voice!")
        }
    },
};


async function createLink(spotifyId, youtubeId) {
    console.log(spotifyId, "-->", youtubeId)
    db.run("insert or replace INTO links (spotifyId, youtubeId) VALUES ($spotifyId, $youtubeId)", {
        $spotifyId: spotifyId,
        $youtubeId: youtubeId,
    })
}

async function getLink(spotifyId) {
    let sql = `SELECT * FROM links WHERE spotifyId = ?`;
    return new Promise((resolve, reject) => {
        db.get(sql, [spotifyId], (err, row) => {
            if (err) {
                reject(err)
            }
            resolve(row?.youtubeId)
        });
    })
}