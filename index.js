const { Client, Events, GatewayIntentBits, Collection, AttachmentBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { exec } = require('child_process');
const { token, clientId, guildId } = require('./config.json');
const express = require('express')
const fs = require("fs")
const app = express()
const port = 3000

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
client.events = new Collection();

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

app.post('/reload', (req, res) => {
    var oldcommands = new Collection();
    client.commands.forEach(command => {
        oldcommands.set(command.data.name, command);
        delete require.cache[require.resolve(`./commands/${command.data.name}.js`)];
        console.log("unloaded: " + command.data.name)
        client.commands.delete(command.data.name);
    });

    var commandsChanged = false;

    const commandFiles = fs.readdirSync('commands').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        console.log("loaded: " + command.data.name)
        client.commands.set(command.data.name, command);

        if (!oldcommands.has(command.data.name)) {
            console.log("NEW COMMAND: " + command.data.name)
            commandsChanged = true;
        }

    }

    oldcommands.forEach(command => {
        if (!client.commands.has(command.data.name)) {
            console.log("DELETED COMMAND: " + command.data.name)
            commandsChanged = true;
        } else {
            if (JSON.stringify(command.data) != JSON.stringify(client.commands.get(command.data.name).data)) {
                console.log("DATA CHANGED: " + command.data.name)
                commandsChanged = true;
            }
        }
    })

    if (commandsChanged) {
        console.log("---DEPLOY---")
        deployGuildCommands()
    }

    res.end()

})

app.post('/events/reload', (req, res) => {
    client.events.forEach(event => {
        client.off(event.name, event.listener)
        delete require.cache[require.resolve(`./events/${event.name}.js`)];
        client.events.delete(event.name);
        console.log("unloaded: " + event.name)
    });

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

    res.end()

})


function deployGuildCommands() {
    const rest = new REST({ version: '10' }).setToken(token);


    const commands = [];
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        console.log(file)
        const command = require(`./commands/${file}`);
        commands.push(command.data.toJSON());

    }

    rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
}


client.login(token)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

module.exports = {
    client
}