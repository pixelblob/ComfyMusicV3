const ytdl = require('ytdl-core');

const fs = require("fs")

const { execSync } = require('node:child_process');

const ffmpeg = require('fluent-ffmpeg');

var videoDownloaded



module.exports = {
    request: "get",
    /** @type {import("express").RequestHandler} */
    async execute(req, res) {
        var { queues } = require("../index")
        //console.log(queues["716871605749416020"].video)
        console.log("VIDEO")
        var tiemout


        if (queues["716871605749416020"].current?.url) {
            if (queues["716871605749416020"].audio != queues["716871605749416020"].current.url) {
                queues["716871605749416020"].audio = queues["716871605749416020"].current.url
                let stream = ytdl(queues["716871605749416020"].current.url, {
                    quality: 'lowestaudio',
                });

                let start = Date.now();
                ffmpeg(stream)
                    .audioBitrate(128)
                    .save(`audio.mp3`)
                    .on('end', () => {
                        console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
                        res.sendFile("/home/pixel/discordbot/ComfyMusicV3/audio.mp3")
                    });
            } else {
                res.sendFile("/home/pixel/discordbot/ComfyMusicV3/audio.mp3")
            }

        }



    },
};