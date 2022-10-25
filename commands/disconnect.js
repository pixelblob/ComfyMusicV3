const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('disconnect')
        .setDescription('Disconnects the musicbot from the current voicechat!'),
    async execute(interaction) {
        var input = interaction.options.getString('input')
        console.log(input)


        if (!interaction.member.voice?.channel) return interaction.reply('Connect to a Voice Channel!')

        const connection = getVoiceConnection(interaction.guild.id)
    
        if (!connection) return interaction.reply('Im not currently connected to a Voice Channel!')

        connection.destroy()

        interaction.reply("Leaving!")
    }

}