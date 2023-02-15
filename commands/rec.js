const { SlashCommandBuilder } = require('@discordjs/builders');
const { EndBehaviorType, createAudioPlayer, joinVoiceChannel, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const prism = require("prism-media")

const play = require('play-dl')
const ytsr = require('scrape-youtube');
const vosk = require('vosk')

const SAMPLE_RATE = 48000

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rec')
        .setDescription('Disconnects the musicbot from the current voicechat!'),
    async execute(interaction) {
        var member = interaction.member
        const connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: member.guild.id,
            adapterCreator: member.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false,
        })

        var { queues, rec, client, model } = require("../index")

        const receiver = connection.receiver;

        var speaking = {}

        receiver.speaking.on('start', (userId) => {
            if (!speaking[userId]) speaking[userId] = {}
            var voskUser = speaking[userId]
            if (voskUser.speaking == true) return
            //console.log(speaking)
            voskUser.speaking = true
            //console.log("TRIGGER")
            var partText = ""

            if (!voskUser.rec) {
                voskUser.rec = new vosk.Recognizer({ model: model, sampleRate: SAMPLE_RATE });
            }

            var rec = voskUser.rec

            const opusStream = receiver.subscribe(userId, {
                end: {
                    behavior: EndBehaviorType.AfterSilence,
                    duration: 500,
                },
            });
            opusStream.pipe(
                new prism.opus.Decoder({ rate: 24000, channels: 2, frameSize: 960 })
            )
                .on("data", (data) => {
                    if (rec.acceptWaveform(data))
                        console.log(rec.result());
                    else {
                        var part = rec.partialResult().partial
                        if (part != "" && partText != part) console.log("\x1b[33m",`${client.users.cache.get(userId).username}: PARTIAL: ${part}`, "\x1b[0m");
                        partText = part
                    }
                }).on("end", async () => {
                    var final = rec.finalResult().text
                    if (final) console.log("\x1b[32m",`${client.users.cache.get(userId).username}: FINAL: ${final}`, "\x1b[0m");

                    if (final.startsWith("play")) {
                        const searchResults = await ytsr.search(final.replace("play ", ""));
                        var video = searchResults.videos[0]
                        console.log(video.title)

                        var stream = await play.stream("https://www.youtube.com/watch?v=" + video.id)

                        let resource = createAudioResource(stream.stream, { inputType: stream.type });

                        var player = createAudioPlayer({
                            behaviors: { noSubscriber: NoSubscriberBehavior.Play }
                        });

                        player.play(resource)
                        connection.subscribe(player)

                    } else if (final.includes("fuck off")) {
                        connection.destroy()
                    }

                    if (final) console.log("-----------end-----------")
                    speaking[userId].speaking = false
                })
        })
    }

}