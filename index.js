const { Client, Events, GatewayIntentBits, Collection, AttachmentBuilder } = require('discord.js');
const fs = require("fs")
const { token } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();

client.on("ready", async () => {
    console.log("Ready")

    //Register's all of the bots "/" commands.
    const commandFiles = fs.readdirSync('commands').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
    }
    console.log(`Found ${client.commands.size} Commands: [${client.commands.map(e => e.data.name).join(", ")}]`)

})

client.on("interactionCreate", async interaction=>{
    //Handles the execution of the "/" commands.
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        
        var attachment = new AttachmentBuilder(Buffer.from(error.stack, 'utf-8'), {name:'error.txt'})
        await interaction.channel.send({ content: 'There was an error while executing this command!', ephemeral: false, files: [attachment]}).catch(e => {
            interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: false, files: [attachment]})
        })
    }
    }
})


client.login(token)