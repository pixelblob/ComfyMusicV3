module.exports = {
    request: "get",
    /** @type {import("express").RequestHandler} */
    execute(req, res) {
        const { addToQueue, queues } = require("../index")
        var sendQueue = {}
        Object.values(queues).forEach((queue,index)=>{
            var playbackDuration = queue?.player?.["_state"]?.playbackDuration
            var status = queue?.player?.["_state"]?.status
            var {queue, current, currentIndex} = queue
            sendQueue[Object.keys(queues)[index]] = {queue, current, currentIndex, playbackDuration: 0 || playbackDuration, status}
        })
        res.json(sendQueue)
    },
};