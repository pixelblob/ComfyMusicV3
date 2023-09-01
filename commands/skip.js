const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Disconnects the musicbot from the current voicechat!'),
    async execute(interaction) {
        var input = interaction.options.getString('input')
        console.log(input)

        var {playYoutubeUrl, queues, updateQueue} = require("../index.js")


        if (!interaction.member.voice?.channel) return interaction.reply('Connect to a Voice Channel!')
    
        if (queues[interaction.guild.id].currentIndex >= queues[interaction.guild.id].queue.length - 1) {
        } else {
            queues[interaction.guild.id].currentIndex++
                queues[interaction.guild.id].current = queues[interaction.guild.id].queue[queues[interaction.guild.id].currentIndex]
                playYoutubeUrl(queues[interaction.guild.id].current.url, interaction.guild.id, interaction.member.id)
        }

        interaction.reply("skipping!")
        updateQueue(interaction.guild.id)
    }

}