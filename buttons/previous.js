const { SlashCommandBuilder } = require('@discordjs/builders');


module.exports = {
    name: 'previous',
    async execute(interaction) {
        const { queues, playYoutubeUrl, updateQueue } = require("../index.js")
        if (!interaction.member.voice.channel) return interaction.reply({ content: 'Please enter a voice channel to use this feature!', ephemeral: true });
        if (!interaction.member.voice.channel.joinable) return interaction.reply({ content: 'Unable to join your current voice channel!', ephemeral: true });

        if (queues[interaction.guildId].currentIndex == 0) {

            if (queues[interaction.guildId].queue.length == 0) {
                //interaction.reply("You are currently at the begining of your queue, which makes sense because its empty...", { failIfNotExists: false })
            } else {
                //interaction.reply("You are currently at the begining of your queue!", { failIfNotExists: false })
            }
        } else {
            queues[interaction.guildId].currentIndex--
                queues[interaction.guildId].current = queues[interaction.guildId].queue[queues[interaction.guildId].currentIndex]
            //playUrl(queues[interaction.guildId].current.url, interaction.member.voice.channel)
            playYoutubeUrl(queues[interaction.guildId].current.url, interaction.guild.id, interaction.member.id)
            //return //interaction.reply("Skipping to previous song!", { failIfNotExists: false });
        }
        interaction.update(interaction)
        updateQueue(interaction.guildId)
    }
}