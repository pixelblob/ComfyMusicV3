module.exports = {
    name: 'skip',
    /** @type {import("discord.js").Interaction} */
    async execute(interaction) {
        const { queues, playYoutubeUrl, client, updateQueue } = require("../index.js") 
        if (!interaction.member.voice.channel) return interaction.reply({ content: 'Please enter a voice channel to use this feature!', ephemeral: true });
        if (!interaction.member.voice.channel.joinable) return interaction.reply({ content: 'Unable to join your current voice channel!', ephemeral: true });

        

        if (queues[interaction.guildId].currentIndex >= queues[interaction.guildId].queue.length - 1) {
        } else {
            queues[interaction.guildId].currentIndex++
                queues[interaction.guildId].current = queues[interaction.guildId].queue[queues[interaction.guildId].currentIndex]
                playYoutubeUrl(queues[interaction.guildId].current.url, interaction.guild.id, interaction.member.id)
        }

        interaction.update(interaction)
        updateQueue(interaction.guildId)
    }
}