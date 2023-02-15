const WebSocket = require('ws');
const axios = require("axios")
const play = require('play-dl')
const ytsr = require('scrape-youtube');

const { EndBehaviorType, createAudioPlayer, joinVoiceChannel, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
module.exports = {
    name: 'voiceStateUpdate',
    once: false,
    async execute(oldState, newState, start) {
        var { tokens, sessions, discordTokens, getSpotifyAccessToken, client } = require("../index.js")
        var oldChannel = oldState.channel
        var newChannel = newState.channel

        const blackListedWords = ['(official music video)', '(official video)']

        if (newChannel != oldChannel && newChannel) {
            console.log("User Join Voice!")
            var storage = discordTokens[newState.id]
            if (storage) {
                var access_token = (await getSpotifyAccessToken(storage.spotifyId))
                console.log(access_token)
                connectToClientWebsocket()

                async function connectToClientWebsocket() {
                    var member = newState.guild.members.cache.get(newState.id)
                    console.log(member.user.username, (await getSpotifyAccessToken(storage.spotifyId)))
                    const ws = new WebSocket('wss://gew1-dealer.spotify.com/?access_token=' + (await getSpotifyAccessToken(storage.spotifyId)))

                    ws.on("error", async error => {
                        console.log(error)
                    })

                    ws.on("open", () => {
                        ws.send(JSON.stringify({ "type": "ping" }))
                    })

                    async function getYoutubeEquivalent(title, originalLength) {
                        const searchResults = await ytsr.search(title);
                        searchResults.videos.filter(v => !blackListedWords.some(bw => v.title.toLowerCase().includes(bw)))
                        //searchResults.videos.filter(v => Math.abs(v.duration - originalLength) < 5)

                        //searchResults.videos.sort((a, b) => Math.abs(originalLength - a.duration) - Math.abs(originalLength - b.duration))

                        //console.log("LENGTH: "+originalLength)

                        //console.log(searchResults.videos)

                        return searchResults.videos[0]
                    }

                    var player
                    var connection
                    var prev_id
                    var active = false

                    ws.addEventListener('message', async event => {
                        let json = event.data;
                        json = JSON.parse(json);
                        console.log(json)
                        if (json.type == "message") {
                            if (json.headers["Spotify-Connection-Id"]) {

                                let response = await axios.get("https://api.spotify.com/v1/me/player/devices", {
                                    headers: {
                                        authorization: "Bearer " + ((await getSpotifyAccessToken(storage.spotifyId)))
                                    }
                                })
                                prev_id = response.data.devices.find(d => d.is_active)?.id


                                axios.post("https://api.spotify.com/v1/track-playback/v1/devices", {
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
                                        authorization: "Bearer " + ((await getSpotifyAccessToken(storage.spotifyId)))
                                    }
                                })
                                    .then(function (response) {
                                        console.log(response.data)
                                        seqNum = response.data["initial_seq_num"]
                                    })
                                    .catch(function (error) {
                                        console.log(error.response.data);
                                    });
                            } else if (json.payloads[0].type == "replace_state") {
                                console.log("CHANGE STATE")
                                var state_machine = json.payloads[0].state_machine
                                var state_ref = json.payloads[0].state_ref

                                if (!json.payloads[0].state_ref) return;

                                active = true

                                async function changeState(state_index, first) {
                                    //console.time("GET SONG")
                                    var metadata = state_machine.tracks[state_machine.states[state_index].track].metadata

                                    //console.log(state_machine.tracks[state_machine.states[state_index].track])

                                    var member = newState.guild.members.cache.get(newState.id)

                                    if (!member.voice.channel) return;

                                    connection = joinVoiceChannel({
                                        channelId: member.voice.channel.id,
                                        guildId: member.guild.id,
                                        adapterCreator: member.guild.voiceAdapterCreator
                                    })

                                    console.time("Find song on youtube")

                                    var ytVideo = await getYoutubeEquivalent(metadata.name + " " + metadata.authors.map(a => a.name).join(" "), metadata.duration / 1000)

                                    console.timeEnd("Find song on youtube")
                                    //console.log(ytVideo)

                                    //console.log("SEEKING: " + (json.payloads[0].seek_to / 1000 || 0))

                                    console.time("Play youtube video")
                                    var options = {}

                                    if (json.payloads[0].seek_to) options.seek = json.payloads[0].seek_to / 1000

                                    var stream = await play.stream("https://www.youtube.com/watch?v=" + ytVideo.id, options)

                                    let resource = createAudioResource(stream.stream, { inputType: stream.type });

                                    if (player) player.removeAllListeners("stateChange")

                                    player = createAudioPlayer({
                                        behaviors: { noSubscriber: NoSubscriberBehavior.Play }
                                    });

                                    player.play(resource)
                                    connection.subscribe(player)

                                    console.timeEnd("Play youtube video")


                                    //console.timeEnd("GET SONG")

                                    axios.put("https://api.spotify.com/v1/track-playback/v1/devices/4de316d68694cfd8b81163fcfbaa739cd129a04g/state", {
                                        "seq_num": seqNum,
                                        "state_ref": {
                                            "state_machine_id": state_machine.state_machine_id,
                                            "state_id": state_machine.states[state_index].state_id,
                                            "paused": false
                                        },
                                        "sub_state": {
                                            "playback_speed": 1,
                                            "position": json.payloads[0].seek_to,
                                            "duration": 0,
                                            "media_type": "AUDIO",
                                            "bitrate": 256000,
                                            "audio_quality": "VERY_HIGH",
                                            "format": 11
                                        }
                                    }, {
                                        headers: {
                                            authorization: "Bearer " + (await getSpotifyAccessToken(storage.spotifyId))
                                        }
                                    }).then(async req => {
                                        state_machine = req.data.state_machine
                                        state_ref = req.data.updated_state_ref

                                        player.on("stateChange", (oldState, newState) => {
                                            console.log(newState.status)
                                            if (newState.status == "idle") {
                                                changeState(state_machine.states[state_ref.state_index].transitions.skip_next.state_index)
                                            }
                                        })
                                    })
                                }

                                changeState(state_ref.state_index, true)
                            } else if (json.payloads[0].reason == "SESSION_DELETED") {
                                console.log("CLIENT HAS DISCONENCTED!")
                                ws.close()

                                if (player) {
                                    player.removeAllListeners("stateChange")
                                }

                                try {
                                    player.stop();
                                    connection.destroy()
                                } catch (error) {
                                    console.log(error)
                                }

                                active = false

                                connectToClientWebsocket()
                            }
                        } else if (json.type == "pong") {
                            //console.log("RECIEVED PONG!")
                            setTimeout(() => {
                                //console.log("SENT PING!")
                                ws.send(JSON.stringify({ "type": "ping" }))
                            }, 15000);
                        }
                    })

                    var listener = async (oldState2, newState2) => {
                        var oldChannel = oldState2.channel
                        var newChannel = newState2.channel
                        if (newChannel != oldChannel && oldChannel) {
                            console.log("LEAVE")
                            if (newState2.id == newState.id) {
                                console.log("Spotify User Leave Voice!")

                                console.log("PREV DEVICEID: " + prev_id)

                                console.log("ACTIVE: "+active)

                                if (active) {
                                    axios.put("https://api.spotify.com/v1/me/player", {
                                        "device_ids": [
                                            prev_id
                                        ],
                                        "play": true
                                    }, {
                                        headers: {
                                            authorization: "Bearer " + ((await getSpotifyAccessToken(storage.spotifyId)))
                                        }
                                    })
                                        .then(function (response) {
                                            console.log(response.data)
                                        })
                                }



                                ws.close()
                                client.removeListener('voiceStateUpdate', listener);
                                try {
                                    player.stop();
                                    connection.destroy()
                                } catch (error) {
                                    console.log(error)
                                }
                                active = false
                            }
                        }
                    }


                    client.on("voiceStateUpdate", listener)

                }
            }
        } else if (newChannel != oldChannel && oldChannel) {
            console.log("User Leave Voice!")
        }
    },
};
