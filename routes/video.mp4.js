const ytdl = require('ytdl-core');

const fs = require("fs")

var videoDownloaded

module.exports = {
    request: "get",
    /** @type {import("express").RequestHandler} */
    async execute(req, res) {
        var { queues } = require("../index")
        //console.log(queues["716871605749416020"].video)
        console.log("VIDEO")
        var tiemout

        console.log(queues["716871605749416020"].video, queues["716871605749416020"].current?.url)

        if (!queues["716871605749416020"].current) {
            res.status(404)
            return res.end()
        }

        if (queues["716871605749416020"].video != queues["716871605749416020"].current?.url && queues["716871605749416020"].current) {
            videoDownloaded = null
            videoDownloaded = new Promise((resolve, reject) => {
            console.log("MAKING NEW VIDEO!")
            queues["716871605749416020"].video = queues["716871605749416020"].current.url

            console.log(queues["716871605749416020"].current.url)

            /* if (fs.existsSync("video.mp4")) {
                clearTimeout(tiemout)
                return res.sendFile("/home/pixel/discordbot/ComfyMusicV3/video.mp4")
            } else { */
            //var video = ytdl(queues["716871605749416020"].current.url, { filter: 'videoonly', quality: "highestvideo" })
            if (!queues["716871605749416020"]?.current?.url) return
             try {
                ytdl.chooseFormat({ filter: 'videoonly', quality: "136" })
                var video = ytdl(queues["716871605749416020"].current.url, { filter: 'videoonly', quality: "136" })
             } catch {
                console.log("1080p not available using next best quality")
                var video = ytdl(queues["716871605749416020"].current.url, { filter: 'videoonly', quality: "highestvideo" })
             }
            console.log(video)
            /* thing.pipe(res) */
            video.pipe(fs.createWriteStream("/home/pixel/discordbot/ComfyMusicV3/video.mp4"))
            /* } */

            video.on('response', function (res2) {
                console.log("RES!")
                var totalSize = res2.headers['content-length'];
                var dataRead = 0;
                res2.on('data', function (data) {
                    dataRead += data.length;
                    var percent = dataRead / totalSize;
                    //process.stdout.cursorTo(0);
                    //process.stdout.clearLine(1);
                    process.stdout.write((percent * 100).toFixed(2) + '% ');
                });
                res2.on('end', function () {
                    resolve()
                    process.stdout.write('\n');
                    console.log("---------------------------- FINISHED DOWNLOADING VIDEO ----------------------------")
                    res.sendFile("/home/pixel/discordbot/ComfyMusicV3/video.mp4", {
                        headers: {
                            'Cache-Control': 'no-cache',
                        }
                    }, function (err) {
                        if (err) {
                            console.log(err);
                            res.status(err.status).end();
                        }
                        else {
                            console.log('Sent!');
                        }
                    })
                });
            });

        })

            //res.end()

        } else {

            /* const stat = fs.statSync("/home/pixel/discordbot/ComfyMusicV3/video.mp4")
            const fileSize = stat.size
            const head = {
              'Content-Length': fileSize,
              'Content-Type': 'video/mp4',
            }
            res.writeHead(200, head)
            fs.createReadStream("/home/pixel/discordbot/ComfyMusicV3/video.mp4").pipe(res) */

            if (videoDownloaded) {
                console.log("WAITING!")
                await videoDownloaded
                console.log("WAITED!")
            }
            
            res.sendFile("/home/pixel/discordbot/ComfyMusicV3/video.mp4", {
                headers: {
                    'Cache-Control': 'no-cache',
                }
            }, function (err) {
                if (err) {
                    console.log(err);
                    res.status(err.status).end();
                }
                else {
                    console.log('Sent!');
                }
            })

        }

    },
};