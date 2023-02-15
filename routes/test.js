module.exports = {
    request: "get",
    execute(req, res) {
        const { addToQueue, queues } = require("../index")
        res.json(queues)
    },
};