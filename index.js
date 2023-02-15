const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { exec } = require('child_process');
const { token, clientId, clientSecret } = require('./config.json');
const express = require('express')
const fs = require("fs")
const axios = require("axios")
const app = express()
const port = 3000
const tokens = require('./tokens.json')
const discordTokens = require('./discordTokens.json')
const sessions = require('./sessions.json')
var cookieParser = require('cookie-parser')
const play = require('play-dl')

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { getVoiceConnection, joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const io = new Server(server);
const vosk = require('vosk')

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
client.events = new Collection();
client.routes = new Collection();

var queues = {}

app.use(cookieParser());

MODEL_PATH = "vosk-model-en-us-0.22"

if (!fs.existsSync(MODEL_PATH)) {
    console.log("Please download the model from https://alphacephei.com/vosk/models and unpack as " + MODEL_PATH + " in the current folder.")
    process.exit()
}

vosk.setLogLevel(0);
const model = new vosk.Model(MODEL_PATH);

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
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
            }

            console.log("Update: " + path)

            fsTimeout = setTimeout(function () { fsTimeout = null }, 1000)
        }
    })
})

client.login(token)

client.on("ready", () => {
    const voiceStateUpdate = require("./events/voiceStateUpdate")
    client.guilds.cache.forEach(guild => {
        guild.voiceStates.cache.forEach(state => {
            voiceStateUpdate.execute({}, state, true)
        })
    })
})

async function playYoutubeUrl(url, guildId, userId) {
    stream = await play.stream(url)

    var connection = getVoiceConnection(guildId)
    var guild = client.guilds.cache.get(guildId)
    var member = guild.members.cache.get(userId)

    var serverQueue = queues[guildId]

    if (!connection) {
        connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: guildId,
            adapterCreator: guild.voiceAdapterCreator
        })
    }

    let resource = createAudioResource(stream.stream, { inputType: stream.type });

    let player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play }
    });

    player.on("stateChange", (oldState, newState) => {
        if (newState.status == "idle") {
            serverQueue.position = serverQueue.position + 1
            if (serverQueue.position <= serverQueue.queueSize) {
                playYoutubeUrl(serverQueue.queue[serverQueue.position].url, guildId, userId)
            }
        }
    })

    player.play(resource)
    connection.subscribe(player)
}

async function addToQueue(details, guildId, userId) {
    var serverQueue = queues[guildId]
    serverQueue.queue.push(details)

    serverQueue.queueSize = serverQueue.queueSize + 1

    var connection = getVoiceConnection(guildId)

    if (!connection) {
        connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: guildId,
            adapterCreator: guild.voiceAdapterCreator
        })
    }

    if (serverQueue.queue.length == 1) {
        console.log("START PLAYING: " + details.title)
        serverQueue.position = 0
        playYoutubeUrl(serverQueue.queue[serverQueue.position].url, guildId, userId)
    }
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

function getAccessToken(userId) {
    var token = discordTokens[userId]
    if (((new Date().getTime() - new Date(token.tokenCreationDate).getTime()) / 1000) > token.expires_in - 21600) {
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
        return token.access_token
    }
}

async function getSpotifyAccessToken(userId) {
    var storage = tokens[userId]
    console.log(storage)
    let req = await axios.post("https://accounts.spotify.com/api/token", new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: storage.refresh_token
    }), {
        headers: {
            'Authorization': 'Basic ' + (Buffer.from('a14fa22647b347379c048f6d373431f9:7bacd1f192774fd7981858d6c8076075').toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).catch(e => {
        console.log(e)
    })

    console.log(req.data)
    /* tokens[userId] = { access_token: req.data.access_token, refresh_token: storage.refresh_token, date: new Date() }
    fs.writeFile("./tokens.json", JSON.stringify(tokens, null, 4), 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }

        console.log("JSON file has been saved.");
    }); */
    return req.data.access_token
}

module.exports = {
    client,
    recurseReadDir,
    app,
    token,
    tokens,
    discordTokens,
    sessions,
    getAccessToken,
    getSpotifyAccessToken,
    queues,
    addToQueue,
    model
}