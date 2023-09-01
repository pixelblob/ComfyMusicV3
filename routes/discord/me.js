const { clientId, clientSecret } = require('../../config.json');
const { default: axios } = require('axios');
const fs = require("fs")

module.exports = {
    request: "get",
    /** @type {import("express").RequestHandler} */
    async execute(req, res) {
        var { discordTokens, sessions, getAccessToken, client, getSession } = require("../../index.js")
        var session = await getSession(req.cookies.sessionId)
        if (session) {
            console.log(session)
            /* var accessToken = getAccessToken(session.userId)
            if (accessToken) {
                axios.get("https://discord.com/api/users/@me", {
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    }
                }).then(req => {
                    res.json(req.data)
                }).catch(e => {
                    console.log(e)
                })
            } else {
                res.status(401)
                res.end()
            } */

            console.log(session.discordId)

            var user = client.users.cache.get(session.discordId)

            if (user) {
                res.json(user)
            } else {
                res.status(401)
                res.end()
            }

        }
    },
};