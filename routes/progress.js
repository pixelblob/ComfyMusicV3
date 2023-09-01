module.exports = {
    request: "get",
    /** @type {import("express").RequestHandler} */
    execute(req, res) {
        const { addToQueue, queues } = require("../index")

        console.log(queues["716871605749416020"])
        
        res.json({"ms": queues["716871605749416020"]?.player?.["_state"]?.playbackDuration || 0, "serverTime": new Date().getTime()})
    },
};