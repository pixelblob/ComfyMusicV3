const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'stop',
    async execute(interaction) {
        var { queues, updateQueue } = require("../index.js")
        if (!interaction.member.voice.channel) return interaction.reply({ content: 'Please enter a voice channel to use this feature!', ephemeral: true });
        if (!interaction.member.voice.channel.joinable) return interaction.reply({ content: 'Unable to join your current voice channel!', ephemeral: true });

        if (getVoiceConnection(interaction.guild.id)) getVoiceConnection(interaction.guild.id).destroy()
        queues[interaction.guild.id].queue = []
        queues[interaction.guild.id].currentIndex = 0
        queues[interaction.guild.id].following = null;
        interaction.update(interaction)
        updateQueue(interaction.guild.id)
    }
}