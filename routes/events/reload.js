const { Routes } = require('discord-api-types/v9');
const { Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require("fs")
module.exports = {
    request: "post",
    execute(req, res) {
        const { client } = require("../../index.js")
        //console.log("here0")
        client.events.forEach(event => {
            client.off(event.name, event.listener)
            //console.log(`./events/${event.name}.js`)
            var thing = require.resolve(`../../events/${event.name}.js`)
            //console.log("DEL")
            delete require.cache[event];
            client.events.delete(event.name);
            console.log("unloaded: " + event.name)
        });

        //console.log("here1")
    
        const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
    
        for (const file of eventFiles) {
            const event = require(`../../events/${file}`);
            if (event.once) {
                event.listener = (...args) => event.execute(...args)
                var listener = client.once(event.name, event.listener);
                client.events.set(event.name, event);
            } else {
                event.listener = (...args) => event.execute(...args)
                var listener = client.on(event.name, event.listener);
                client.events.set(event.name, event);
            }
            console.log("loaded: " + event.name)
        }
        res.end()
    },
};