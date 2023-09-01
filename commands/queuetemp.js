const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queuetemp')
        .setDescription('Temporary command to test what the queue command should look like?'),
    async execute(interaction) {
        console.log("AAA")
        var { queues, updateQueue } = require("../index.js")
        var queue = queues[interaction.guild.id]

        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setEmoji('<:skipbackward:1020686561618182256>')
                .setStyle(ButtonStyle.Success)
                /* .setLabel("Prev") */
                .setDisabled(!!queue.following),
                new ButtonBuilder()
                .setCustomId('pause-play')
                .setEmoji('<:play:1020684936136626216>')
                .setStyle(ButtonStyle.Secondary)
                /* .setLabel("Pause/Play") */
                .setDisabled(!!queue.following),
                new ButtonBuilder()
                .setCustomId('stop')
                /* .setLabel("Stop") */
                .setEmoji('<:stop:1020684934253387786>')
                .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                /* .setLabel("Skip") */
                .setCustomId('skip')
                .setEmoji('<:skip:1020684940444176436>')
                .setStyle(ButtonStyle.Success)
                .setDisabled(!!queue.following),
                new ButtonBuilder()
                .setLabel("Join")
                .setCustomId('join')
                .setEmoji('🫂')
                .setStyle(ButtonStyle.Primary)
                
        );

        const exampleEmbed = new EmbedBuilder()
        exampleEmbed.setTitle("Waiting To Be Populated!")
        interaction.reply({embeds: [exampleEmbed], components: [row]}).then(()=>{
            updateQueue(interaction.guild.id)
        })
        
    }
}