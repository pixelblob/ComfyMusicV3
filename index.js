const { Client, Events, GatewayIntentBits, Collection, AttachmentBuilder } = require('discord.js');
const { exec } = require('child_process');
const { token, clientId, guildId } = require('./config.json');
const express = require('express')
const fs = require("fs")
const axios = require("axios")
const app = express()
const port = 3000
const tokens = require('./tokens.json')
const discordTokens = require('./discordTokens.json')
const sessions = require('./sessions.json')
var cookieParser = require('cookie-parser')

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
client.events = new Collection();
client.routes = new Collection();

app.use(cookieParser());

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
                axios.post("http://127.0.0.1:3000/events/reload").catch(e=>{
                    console.log("Failed to reload: "+path)
                })
            } else if (path.startsWith("./commands")) {
                axios.post("http://127.0.0.1:3000/reload").catch(e=>{
                    console.log("Failed to reload: "+path)
                })
            } else if (path.startsWith("./routes")) {
                axios.post("http://127.0.0.1:3000/routes/reload").catch(e=>{
                    console.log("Failed to reload: "+path)
                })
            }

            console.log("Update: "+path)

            fsTimeout = setTimeout(function () { fsTimeout = null }, 1000)
        }
    })
})

console.log(watchDirectorys)

client.login(token)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)

    const { CreatePXRoutes, CreateCommandRoutes } = require("./util/pxRoute.js")
    CreatePXRoutes()
    CreateCommandRoutes()
})

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

module.exports = {
    client,
    recurseReadDir,
    app,
    token,
    tokens,
    discordTokens,
    sessions
}