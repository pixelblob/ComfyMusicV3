const { Routes } = require('discord-api-types/v9');
const { Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require("fs")
module.exports = {
    request: "post",
    execute(req, res) {
        const { client, token } = require("../index.js")
        var oldcommands = new Collection();
        client.commands.forEach(command => {
            oldcommands.set(command.data.name, command);
            delete require.cache[require.resolve(`../commands/${command.data.name}.js`)];
            console.log("unloaded: " + command.data.name)
            client.commands.delete(command.data.name);
        });
    
        var commandsChanged = false;

        setTimeout(() => {
            const commandFiles = fs.readdirSync('commands').filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            console.log(command)
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
            deployGuildCommands(token, client.user.id, "716871605749416020", client.commands)
        }
        res.end()  
        }, 50);
    
        
    },
};

function deployGuildCommands(token, clientId, guildId, commands) {
    const rest = new REST({ version: '10' }).setToken(token);

    commands = [];
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        console.log(file)
        const command = require(`../commands/${file}`);
        commands.push(command.data.toJSON());
    }

    rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
}