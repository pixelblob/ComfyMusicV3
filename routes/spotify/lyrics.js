module.exports = {
    request: "get",
    /** @type {import("express").RequestHandler} */
    async execute(req, res) {
        var { queues } = require("../../index.js")
        var { getLyrics } = require("../../getLyrics.js")
        var queue = queues["716871605749416020"]
        console.log(queue)
        if (queue?.current?.uri) {
            var trackId = queue.current.uri.split(":").at(-1)
            console.log(trackId)
            try {
                var data = await getLyrics(trackId)
                console.log(data)
                res.json(data.lyrics.lines)
            } catch (error) {
                res.status(404)
                res.json({
                    "error": {
                        "code": res.statusCode,
                        "message": "Lyrics Not Found"
                    }
                })
            }

        } else {
            //res.json({error})
            res.status(404)
            res.json({
                "error": {
                    "code": res.statusCode,
                    "message": "No song currently playing!"
                }
            })
        }
    },
};