const fs = require("fs")

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log('Ready!\n' + `Found ${client.guilds.cache.size} Servers: [${client.guilds.cache.map(g => g.name).join(", ")}]`)

        //Register's all of the bots "/" commands.
        const commandFiles = fs.readdirSync('commands').filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            if (!command.data) continue;
            client.commands.set(command.data.name, command);
        }
        console.log(`Found ${client.commands.size} Commands: [${client.commands.map(e => e.data.name).join(", ")}]`)

        //Register all of the bots buttons :>
        const buttonFiles = fs.readdirSync('buttons').filter(file => file.endsWith('.js'));
        for (const file of buttonFiles) {
            const button = require(`../buttons/${file}`);
            client.buttons.set(button.name, button);
        }
        console.log(`Found ${client.buttons.size} Buttons: [${client.buttons.map(e=> e.name).join(", ")}]`)

        var { queues } = require("../index")

        client.guilds.cache.forEach(guild => {
            console.log(guild.name)
            queues[guild.id] = { current: null, queue: [], position: null, queueSize: 0 }
        })
    },
};
