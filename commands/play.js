const { SlashCommandBuilder } = require('@discordjs/builders');
const { EndBehaviorType, createAudioPlayer, joinVoiceChannel, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl')
const ytsr = require('scrape-youtube');

const youtubeRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/

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

        const { addToQueue, queues } = require("../index")


        if (!interaction.member.voice?.channel) return interaction.channel.send('Connect to a Voice Channel')

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator
        })

        var stream;

        var seconds;

        var details

        if (input.match(youtubeRegex)) {
            details = await play.video_basic_info(input)
        } else {
            details = await play.video_basic_info((await ytsr.search(input)).videos[0].link);
        }

        details = details.video_details

        console.log(details)

        addToQueue(details, interaction.guild.id)

        var serverQueue = queues[interaction.guild.id]
        
        if (serverQueue.queue.length > 1) {
            interaction.reply(`Adding to the queue! (${serverQueue.queue.length})`)
        } else {
            interaction.reply("Playing!")
        }

        /* if (input.match(youtubeRegex)) {
            const params = new URLSearchParams(input.match(youtubeRegex)[6])
            console.log(input.match(youtubeRegex)[5])
            var options = {}
            if (params.has('t')) options.seek = params.get('t')
            console.log(options)
            stream = await play.stream(input, options)
        } else if (!input.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/)) {
            console.time("Search for video")
            const searchResults = await ytsr.search(input);
            console.timeEnd("Search for video")
            stream = await play.stream("https://www.youtube.com/watch?v="+searchResults.videos[0].id, {seek: 0})
        } else {
            return interaction.reply("Invalid Input")
        }

        let resource = createAudioResource(stream.stream, { inputType: stream.type });

        let player = createAudioPlayer({
            behaviors: { noSubscriber: NoSubscriberBehavior.Play }
        });

        player.play(resource)
        connection.subscribe(player)
        interaction.reply("Playing!") */
    }

}