const { EndBehaviorType, createAudioPlayer, joinVoiceChannel, createAudioResource } = require('@discordjs/voice');
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const ytdl = require("ytdl-core-discord");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });


client.on("ready", async () => {
    console.log("Ready")
    var voiceChannel = client.guilds.cache.get("716871605749416020").members.cache.get("290444481743028224").voice.channel

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
    });

    const resource = createAudioResource(await ytdl("https://www.youtube.com/watch?v=O1g_DIaVQ2o&t=580s", {highWaterMark: 1}), { type: 'opus' });
    const player = createAudioPlayer();

    connection.subscribe(player);

    player.play(resource);

    player.on("debug", msg=>{
        console.log(msg)
    })

    player.on('error', error => {
        console.error(error);
    });
})


client.login(token)