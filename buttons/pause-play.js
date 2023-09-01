module.exports = {
    name: 'pause-play',
    async execute(interaction) {
        const { queues, addQueue, youtubeSearch, getSpotifySong, updateQueue } = require("../index.js")
        if (!interaction.member.voice.channel) return interaction.reply({ content: 'Please enter a voice channel to use this feature!', ephemeral: true });
        if (!interaction.member.voice.channel.joinable) return interaction.reply({ content: 'Unable to join your current voice channel!', ephemeral: true });
        const player = queues[interaction.guildId].player

        console.log(interaction)
        interaction.update(interaction)
        if (!player) return;
        if (player.pause()) {
            //interaction.reply("Paused!")
        } else {
            player.unpause()
            //interaction.reply("Unpaused!")
        }
        updateQueue(interaction.guildId)
    }
}