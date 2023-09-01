const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const { EndBehaviorType, createAudioPlayer, joinVoiceChannel, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('find')
        .setDescription('Requests a song to play on the musicbot.')
        .addIntegerOption(option =>
            option.setName('input')
                .setDescription('Enter a valid url or search term!')
                .setRequired(true)),
                /**
   * @param {Discord.Interaction} interaction
   */
    async execute(interaction) {
        var target = interaction.options.getInteger('input')
        console.log(target)

        const { queues, playYoutubeUrl, client, updateQueue } = require("../index.js") 
        if (!interaction.member.voice.channel) return interaction.reply({ content: 'Please enter a voice channel to use this feature!', ephemeral: true });
        if (!interaction.member.voice.channel.joinable) return interaction.reply({ content: 'Unable to join your current voice channel!', ephemeral: true });

        var queue = queues[interaction.guildId]

        target--

        if (target >= queues[interaction.guildId].queue.length - 1) {
            interaction.reply("Too Far!")
        } else {
            queue.currentIndex = target
                queue.current = queue.queue[target]
                playYoutubeUrl(queue.current.url, interaction.guild.id, interaction.member.id)
                console.log(queue.current.title)
                interaction.reply("Skipping to "+queue.current.title)
        }

        //interaction.update(interaction)
        updateQueue(interaction.guildId)

    }

}
