const { Client, GatewayIntentBits, Collection, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { token, clientId, clientSecret, sp_secret, sp_id } = require('./config.json');
const express = require('express')
const fs = require("fs")
const axios = require("axios")
const app = express()
const port = 3000
//const sessions = require('./sessions.json')
var cookieParser = require('cookie-parser')
const play = require('play-dl')

const ytdl = require('ytdl-core-discord');

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { getVoiceConnection, joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const io = new Server(server);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

client.commands = new Collection();
client.events = new Collection();
client.buttons = new Collection();
client.routes = new Collection();

var spotifyApiKey

var queues = {}

app.use(cookieParser());



const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    console.log(file)
    try {
        const event = require(`./events/${file}`);
        if (event.once) {
            event.listener = (...args) => event.execute(...args)
            var listener = client.once(event.name, event.listener);
            client.events.set(event.name, event);
        } else {
            event.listener = (...args) => event.execute(...args)
            var listener = client.on(event.name, event.listener);
            client.events.set(event.name, event);
        }
    } catch (error) {
        console.log(error)
    }

}
console.log(`Found ${client.events.size} Events: [${client.events.map(e => e.name).join(", ")}]`)

var watchDirectorys = ["./events", "./commands", "./routes"]

watchDirectorys.forEach(directory => {
    watchDirectorys = watchDirectorys.concat(recurseGetDirs(directory))
})
watchDirectorys.forEach(directory => {
    var fsTimeout
    fs.watch(directory, (eventType, filename) => {
        if (!fsTimeout) {

            var path = directory + "/" + filename

            if (path.startsWith("./events")) {
                axios.post("http://127.0.0.1:3000/events/reload").catch(e => {
                    console.log("Failed to reload: " + path)
                })
            } else if (path.startsWith("./commands")) {
                axios.post("http://127.0.0.1:3000/reload").catch(e => {
                    console.log("Failed to reload: " + path)
                })
            } else if (path.startsWith("./routes")) {
                axios.post("http://127.0.0.1:3000/routes/reload").catch(e => {
                    console.log("Failed to reload: " + path)
                })
            } else if (path.startsWith("./buttons")) {
                axios.post("http://127.0.0.1:3000/buttons/reload").catch(e => {
                    console.log("Failed to reload: " + path)
                })
            }

            console.log("Update: " + path)

            fsTimeout = setTimeout(function () { fsTimeout = null }, 1000)
        }
    })
})

client.login(token)

client.on("ready", () => {
    console.log("READY!")

    try {
        const voiceStateUpdate = require("./events/voiceStateUpdate")
        client.guilds.cache.forEach(guild => {
            queues[guild.id] = { queue: [], currentIndex: 0 }
            guild.voiceStates.cache.forEach(state => {
                voiceStateUpdate.execute({}, state, true)
            })
        })
    } catch (error) {
        console.log(error)
    }


})

async function playYoutubeUrl(url, guildId, userId) {
    console.time("START PLAY")
    console.time("GET STREAM")
    var stream = await play.stream(url)
    console.timeEnd("GET STREAM")

    //var stream = await ytdl(url,{filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1<<25 })

    var connection = getVoiceConnection(guildId)
    var guild = client.guilds.cache.get(guildId)
    var member = guild.members.cache.get(userId)

    var serverQueue = queues[guildId]

    if (!connection) {
        console.log("New Voice Connection!")
        connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: guildId,
            adapterCreator: guild.voiceAdapterCreator
        })

        connection.on('stateChange', (oldState, newState) => {
            Reflect.get(oldState, 'networking')?.off('stateChange', networkStateChangeHandler);
            Reflect.get(newState, 'networking')?.on('stateChange', networkStateChangeHandler);
        });

    }

    var player

    if (serverQueue.player) {
        player = serverQueue.player
    } else {
        console.log("NEW PLAYER!")
        player = createAudioPlayer({
            behaviors: { noSubscriber: NoSubscriberBehavior.Play }
        });

        serverQueue.player = player

        player.on('error', error => {
            console.error(error);
        });

        player.on("stateChange", (oldState, newState) => {
            console.log()
            if (newState.status == "idle") {
                console.log("IDLE")
                serverQueue.currentIndex = serverQueue.currentIndex + 1
                updateQueue(guildId)
                console.log(serverQueue.currentIndex, serverQueue.queue.length)
                if (serverQueue.currentIndex < serverQueue.queue.length) {
                    playYoutubeUrl(serverQueue.queue[serverQueue.currentIndex].url, guildId, userId)
                }
            }
        })

        player.on('stateChange', (oldState, newState) => {
            console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
        });

    }

    let resource = createAudioResource(stream.stream, { inputType: stream.type }/* , {inlineVolume: false,inputType: "opus"} */);



    //serverQueue.player = player


    player.play(resource)
    connection.subscribe(player)
    //updateQueue(guildId)

    console.timeEnd("START PLAY")

}

async function addToQueue(details, guildId, userId) {
    var serverQueue = queues[guildId]
    serverQueue.queue.push(/* details */{ title: details.title, url: details.url, id: details.id, spotifyUrl: details.spotifyUrl, authors: details.authors, images: details.images || details.thumbnails })

    serverQueue.queueSize = serverQueue.queueSize + 1

    var connection = getVoiceConnection(guildId)

    var guild = client.guilds.cache.get(guildId)
    var member = guild.members.cache.get(userId)

    if (!connection) {
        console.log("New Voice Connection!")
        connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: guildId,
            adapterCreator: guild.voiceAdapterCreator
        })
        const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
            const newUdp = Reflect.get(newNetworkState, 'udp');
            clearInterval(newUdp?.keepAliveInterval);
        }
        connection.on('stateChange', (oldState, newState) => {
            Reflect.get(oldState, 'networking')?.off('stateChange', networkStateChangeHandler);
            Reflect.get(newState, 'networking')?.on('stateChange', networkStateChangeHandler);
        });
    }

    if (serverQueue.queue.length == 1) {
        console.log("START PLAYING: " + details.title)
        serverQueue.currentIndex = 0
        playYoutubeUrl(serverQueue.queue[serverQueue.currentIndex].url, guildId, userId)
    } else if (serverQueue.currentIndex == serverQueue.queue.length - 1) {
        console.log("PLAY!")
        playYoutubeUrl(serverQueue.queue[serverQueue.currentIndex].url, guildId, userId)
    }
}

async function clearQueue(guildId) {
    var serverQueue = queues[guildId]
    serverQueue.queue = []
}

io.on('connection', (socket) => {
    console.log('a user connected');
});

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)

    const { CreatePXRoutes, CreateCommandRoutes } = require("./util/pxRoute.js")
    CreatePXRoutes()
    CreateCommandRoutes()
});


function recurseReadDir(dir) {
    var files = []
    var routeFiles = fs.readdirSync(dir);
    for (const routeFile of routeFiles) {
        var stat = fs.statSync(dir + "/" + routeFile);
        if (stat && stat.isDirectory()) {
            files = files.concat(recurseReadDir(dir + "/" + routeFile));
        } else {
            files.push(dir + "/" + routeFile);
        }
    }
    return files
}

function recurseGetDirs(dir) {
    var directorys = []
    var routeFiles = fs.readdirSync(dir);
    for (const routeFile of routeFiles) {
        var stat = fs.statSync(dir + "/" + routeFile);
        if (stat && stat.isDirectory()) {
            console.log(dir + "/" + routeFile)
            directorys.push(dir + "/" + routeFile)
            directorys = directorys.concat(recurseGetDirs(dir + "/" + routeFile));
        }
    }
    return directorys
}

async function getDiscordUser(id) {
    let sql = `SELECT * FROM discordUsers WHERE discordId = ?`;
    return new Promise((resolve, reject) => {
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err)
            }
            resolve(row)
        });
    })
}

function getAccessToken(userId) {
    var token = getDiscordUser(userId)
    if (!token) return null;
    if (((new Date().getTime() - new Date(token.tokenCreationDate).getTime()) / 1000) > token.expires_in - 21600) {
        console.log("USING NEW DISCORD TOKEN")
        axios.post("https://discord.com/api/oauth2/token", new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: token.refresh_token
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        }).then(req => {
            discordTokens[userId] = { access_token: req.data.access_token, refresh_token: req.data.refresh_token, expires_in: req.data.expires_in, tokenCreationDate: new Date() }
            if (token.spotifyId) discordTokens[userId].spotifyId = token.spotifyId
            fs.writeFile("./discordTokens.json", JSON.stringify(discordTokens, null, 4), 'utf8', function (err) {
                if (err) {
                    console.log("An error occured while writing JSON Object to File.");
                    return console.log(err);
                }
                console.log("JSON file has been saved.");
            });
        }).catch(e => {
            console.log(e)
        })
    } else {
        //console.log("USING OLD DISCORD TOKEN")
        return token.access_token
    }
}

const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./central.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected!');
});

async function getSpotifyUser(data) {
    var { discordId, spotifyId } = data || {}
    let sql = `SELECT * FROM spotifyUsers WHERE ${spotifyId ? `spotifyId = ?` : `discordId = ?`}`;
    return new Promise((resolve, reject) => {
        db.get(sql, [spotifyId || discordId], (err, row) => {
            if (err) {
                reject(err)
            }
            resolve(row)
        });
    })
}

async function createSpotifyUser(arg) {
    console.log(arg)
    db.run("insert or replace INTO spotifyUsers (spotifyId, discordId, accessToken, refreshToken, date) VALUES ($spotifyId, $discordId, $accessToken, $refreshToken, $date)", {
        $spotifyId: arg["spotifyId"],
        $discordId: arg["discordId"],
        $accessToken: arg["accessToken"],
        $refreshToken: arg["refreshToken"],
        $date: arg["date"]
    })
}

async function getSpotifyAccessToken(userId) {
    //var storage = tokens[userId]

    console.log(userId)

    var storage = await getSpotifyUser({spotifyId: userId})


    //return


    if ((new Date().getTime() - new Date(storage.date).getTime()) / 1000 > 3600) {
        console.log("GENERATING A NEW ACCESS TOKEN: " + userId)
        let req = await axios.post("https://accounts.spotify.com/api/token", new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: storage.refreshToken
        }), {
            headers: {
                'Authorization': 'Basic ' + (Buffer.from('a14fa22647b347379c048f6d373431f9:7bacd1f192774fd7981858d6c8076075').toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        storage.accessToken = req.data.access_token
        storage.date = new Date()

        createSpotifyUser(storage)

    } else {
        console.log("USING OLD ACCESS TOKEN: " + userId)
    }
    return storage.accessToken
}

var updating = false

var queuedUpdate = false

async function updateQueue(guildId) {

    var queue = queues[guildId]

    queue.current = queue.queue[queue.currentIndex]

    var sendQueue = {}
    Object.values(queues).forEach((queue, index) => {
        var { queue, current, currentIndex } = queue
        sendQueue[Object.keys(queues)[index]] = { queue, current, currentIndex }
    })
    io.sockets.emit('queueUpdate', sendQueue)

    if (updating) return queuedUpdate = true
    updating = true
    console.log("----UPDATE QUEUE CALLED----")
    console.time("UPDATE QUEUE")

    var queueList = ""

    //console.log(queue)





    var title = queue.following ? (`**Now Following: __${queue.following.user.username}__**`) : (`[${queue.queue.length}] ` + "QUEUE" + (queues[guildId].player ? (queues[guildId].player["_state"].status == "playing" ? " *[Playing]*" : " *[Paused]*") : "" + " " + (queues[guildId].repeat ? " *[Repeat]*" : "") + " " + (queues[guildId].loop ? " *[Loop]*" : "")))

    var queueSize = 11
    var offset = queue.currentIndex < Math.floor(queueSize / 2) ? 0 : queue.currentIndex - Math.floor(queueSize / 2)
    var shortQueue = queue.queue.slice(0 + offset, queueSize + offset)
    for (let i = 0; i < shortQueue.length; i++) {
        queueList = queueList + `${i + offset + 1} - ` + (i + offset == queue.currentIndex ? "**__" : "") + `[${shortQueue[i].title}](${shortQueue[i].url})` + (i + offset == queue.currentIndex ? "__** ⏺" : "") + (shortQueue[i].requester ? ` **<@${shortQueue[i].requester.user.id}>**` : "") + (i == shortQueue.length ? "" : "\n")
    }

    console.log("QUEUE:")
    //console.log(queue.queue)
    console.log()

    console.log("SHORTQUEUE:")
    //console.log(shortQueue)
    console.log()

    console.log("OFFSET:")
    console.log(offset)
    console.log()

    console.log("QUEUELIST:")
    //console.log(queueList)
    console.log()

    var channels = Array.from(client.guilds.cache.get(guildId).channels.cache.filter(c => c.type == ChannelType.GuildText).values())

    for (const channel of channels) {
        //console.log(channel)
        const msg = channel.messages.cache.filter(m => m.interaction).reverse().find(m => m.interaction.commandName == "queuetemp")
        //console.log(msg)
        if (msg) {
            var embed = msg.embeds[0]
            embed.description = queueList
            embed.title = title
            //var newcomponents = []
            //msg.components[0].components.forEach(function(c) {c.customId == "stop" ? c.disabled= false : c.disabled=!!queue.following; newcomponents.push(c)})

            const row = new ActionRowBuilder()
            await msg.edit({ embeds: [embed], allowedMentions: { "users": [] } })
        }
    }



    client.guilds.cache.get(guildId).channels.cache.filter(c => c.type == ChannelType.GuildText).forEach(async function (c) {
        var msg = c.messages.cache.filter(m => m.interaction).reverse().find(m => m.interaction.commandName == "queuetemp")

        if (msg) {

            //console.log("Found msg in: " + c.name)

            var embed = msg.embeds[0].data
            //console.log(msg)


            embed.description = queueList

            embed.title = title


            //console.log("EMBED:")
            //console.log(embed)


            msg.edit({ embeds: [embed], allowedMentions: { "users": [] } })
            var newcomponents = []
            //msg.components[0].components.forEach(function (c) { c.customId == "pause-play" ? c.setEmoji("<:pause:1020684938317668412>") : c.disabled = !!queue.following; c.customId == "stop" ? c.disabled = false : c.disabled = !!queue.following; newcomponents.push(c) })

            const row = new ActionRowBuilder()
                .addComponents(newcomponents)

        } else {
            //console.log("no msg in: " + c.name)
        }


    })

    updating = false
    console.timeEnd("UPDATE QUEUE")

    if (queuedUpdate) {
        updateQueue(guildId)
        queuedUpdate = false
    }

}

async function generateSpotifyApiKey() {
    let request = await axios({
        url: 'https://accounts.spotify.com/api/token',
        method: 'post',
        params: {
            grant_type: 'client_credentials'
        },
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
            username: sp_id,
            password: sp_secret
        }
    })
    return request.data.access_token
}

async function getSpotifyPlaylist(id, offset = 0) {
    // generate new access key each time function is run
    let res = await axios.get('https://api.spotify.com/v1/playlists/' + id, {
        headers: {
            'Authorization': "Bearer " + spotifyApiKey,
        },
    }).catch(async function (e) {
        console.log("ee", e.response.data.error.message)
        if (e.response.data.error.message == "The access token expired" || e.response.data.error.message == "Invalid access token") {
            return generateSpotifyApiKey().then(function (key) {
                console.log("Refreshed Spotify Api Key!")
                spotifyApiKey = key
                return getSpotifyPlaylist(id, offset);
            })
        } else throw e.response.data.error.message;

    });

    res.data.tracks.items = []

    console.log("CALLED!!!!")
    var promises = [];
    for (let index = 0; index < Math.min(Math.max(res.data.tracks.total, 0), 500); index = index + 100) {
        console.log(index)
        promises.push(axios.get(`https://api.spotify.com/v1/playlists/${id}/tracks?offset=${index}`, {
            headers: {
                "Content-Type": "application/json",
                'Authorization': "Bearer " + spotifyApiKey,
            },
        }).then(result => {
            res.data.tracks.items = res.data.tracks.items.concat(result.data.items)
        }))

    }

    await Promise.all(promises)

    console.log("NEWLENGTH" + res.data.tracks.items.length)

    return await res

}
async function getSpotifyAlbum(id) {
    console.log(id)
    return axios.get('https://api.spotify.com/v1/albums/' + id, {
        headers: {
            'Authorization': "Bearer " + spotifyApiKey,
        },
    }).catch(async function (e) {
        console.log("ee", e.response.data.error.message)
        if (e.response.data.error.message == "The access token expired" || e.response.data.error.message == "Invalid access token") {
            return generateSpotifyApiKey().then(function (key) {
                console.log("Refreshed Spotify Api Key!")
                spotifyApiKey = key
                return getSpotifyAlbum(id);
            })
        } else throw e.response.data.error.message;

    });
}

async function getSpotifySong(id) {
    console.log(id)
    return axios.get('https://api.spotify.com/v1/tracks/' + id, {
        headers: {
            'Authorization': "Bearer " + spotifyApiKey,
        },
    }).catch(async function (e) {
        console.log("ee", e.response.data.error.message)
        if (e.response.data.error.message == "The access token expired" || e.response.data.error.message == "Invalid access token") {
            return generateSpotifyApiKey().then(function (key) {
                console.log("Refreshed Spotify Api Key!")
                spotifyApiKey = key
                return getSpotifySong(id);
            })
        } else throw e.response.data.error.message;

    });
}

async function createDiscordUser(arg) {
    console.log(arg)
    db.run("insert or replace INTO discordUsers (discordId, accessToken, refreshToken, accessTokenDate, expires) VALUES ($discordId, $accessToken, $refreshToken, $accessTokenDate, $expires)", {
        $discordId: arg["id"],
        $accessToken: arg["accessToken"],
        $refreshToken: arg["refreshToken"],
        $accessTokenDate: new Date().getTime(),
        $expires: arg["expires"]
    })
}

async function getSession(id) {
    let sql = `SELECT * FROM sessions WHERE sessionId = ?`;
    return new Promise((resolve, reject) => {
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err)
            }
            resolve(row)
        });
    })
}

async function createSession(arg) {
    console.log(arg)
    db.run("insert or replace INTO sessions (sessionId, discordId) VALUES ($sessionId, $discordId)", {
        $sessionId: arg["id"], 
        $discordId: arg["discordId"]
    })
}

module.exports = {
    client,
    recurseReadDir,
    app,
    token,
    getAccessToken,
    getSpotifyAccessToken,
    queues,
    addToQueue,
    updateQueue,
    getSpotifyPlaylist,
    io,
    playYoutubeUrl,
    getSpotifySong,
    clearQueue,
    getSpotifyAlbum,
    getDiscordUser,
    getSpotifyUser,
    createDiscordUser,
    createSession,
    getSession,
    createSpotifyUser
}