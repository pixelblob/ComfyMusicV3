const { SlashCommandBuilder } = require('@discordjs/builders');
const { EndBehaviorType, createAudioPlayer, joinVoiceChannel, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Requests a song to play on the musicbot.')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('Enter a valid url or search term!')
                .setRequired(true)),
    async execute(interaction) {
        var input = interaction.options.getString('input')
        console.log(input)


        if (!interaction.member.voice?.channel) return interaction.channel.send('Connect to a Voice Channel')

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator
        })

        let stream = await play.stream(input)

        let resource = createAudioResource(stream.stream, { inputType: stream.type });

        let player = createAudioPlayer({
            behaviors: { noSubscriber: NoSubscriberBehavior.Play }
        });

        player.play(resource)
        connection.subscribe(player)
        interaction.reply("Playing!")
    }

}