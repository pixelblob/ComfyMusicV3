const { clientId, clientSecret } = require('../../config.json');
const { default: axios } = require('axios');
const fs = require("fs")

module.exports = {
    request: "get",
    /** @type {import("express").RequestHandler} */
    async execute(req, res) {
        var { discordTokens, sessions, getAccessToken, client } = require("../../index.js")
        var session = sessions[req.cookies.sessionId]
        if (session) {
            console.log(session)

            console.log(session.userId)

            var guilds = []

            for (const guild of Array.from(client.guilds.cache.values())) {
                console.log(guild.name)
                try {
                    var member = await guild.members.fetch(session.userId)
                    guilds.push({ name: guild.name })
                } catch (error) {
                    console.log(error)
                }
            }

            if (guilds) {
                res.json(guilds)
            } else {
                res.status(401)
                res.end()
            }

        }
    },
};