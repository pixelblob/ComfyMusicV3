const { SlashCommandBuilder } = require('@discordjs/builders');
const { EndBehaviorType, createAudioPlayer, joinVoiceChannel, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl')
const ytsr = require('scrape-youtube');

const youtubeRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Gets your public spotify playlists.'),
    async execute(interaction) {
        interaction.reply("Test!")
    }
}