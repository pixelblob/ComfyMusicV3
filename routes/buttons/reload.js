const { Collection } = require('discord.js');
const fs = require("fs")
module.exports = {
    request: "post",
    execute(req, res) {
        const { client, token } = require("../../index.js")
        var oldbuttons = new Collection();
        client.buttons.forEach(button => {
            oldbuttons.set(button.name, button);
            delete require.cache[require.resolve(`../../buttons/${button.name}.js`)];
            console.log("unloaded: " + button.name)
            client.buttons.delete(button.name);
        });

        var commandsChanged = false;

        setTimeout(() => {
            const buttonFiles = fs.readdirSync('buttons').filter(file => file.endsWith('.js'));
            for (const file of buttonFiles) {
                const button = require(`../../buttons/${file}`);
                console.log(button)
                console.log("loaded: " + button.name)
                client.buttons.set(button.name, button);
            }
            res.end()
        }, 50);


    },
};