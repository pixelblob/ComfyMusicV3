module.exports = {
    request: "get",
    /** @type {import("express").RequestHandler} */
    execute(req, res) {
        var { client } = require("../../index.js")

        var userId = req.url.split("/").pop()
        console.log(userId)
        var user = client.users.cache.get(userId)

        if (user) {
            res.json(user)
        } else {
            res.status(404)
            res.end()
        }

    },
};