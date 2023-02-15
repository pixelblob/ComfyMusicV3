const {MessageAttachment, Interaction} = require("discord.js")


module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction) {

        const { client } = require("../index.js")

        //Handles the execution of the "/" commands.
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            
            //var attachment = new MessageAttachment(Buffer.from(error.stack, 'utf-8'), 'error.txt')
            /* await interaction.channel.send({ content: 'There was an error while executing this command!', ephemeral: false, files: [attachment]}).catch(e => {
                interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: false, files: [attachment]})
            }) */
        }
        }
    },
};