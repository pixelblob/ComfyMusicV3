const { clientId, clientSecret } = require('../../config.json');
const { default: axios } = require('axios');
const fs = require("fs")

module.exports = {
    request: "get",
    execute(req, res) {
        var { discordTokens, sessions, getAccessToken } = require("../../index.js")
        var session = sessions[req.cookies.sessionId]
        if (session) {
            console.log(session)
            console.log(getAccessToken(session.userId))
            axios.get("https://discord.com/api/users/@me", {
                headers: {
                    'Authorization': 'Bearer ' + getAccessToken(session.userId)
                }
            }).then(req => {
                res.json(req.data)
            }).catch(e=>{
                console.log(e)
            })
        }
    },
};