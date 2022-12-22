const { default: axios } = require("axios");
const { clientId, clientSecret } = require('../../config.json');
var crypto = require('crypto');
const fs = require("fs")

module.exports = {
    request: "get",
    /** @type {import("express").RequestHandler} */
    execute(req, res) {
        var code = req.query.code
        var { discordTokens, sessions } = require("../../index.js")
        axios.post("https://discord.com/api/oauth2/token", new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `http://pixelboop.net:3000/discord/callback`,
            scope: 'identify',
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        }).then(req => {
            console.log(req.data)

            axios.get("https://discord.com/api/users/@me", {
                headers: {
                    'Authorization': 'Bearer ' + req.data.access_token
                }
            }).then(req2 => {
                /* console.log(req2.data.id)
                discordTokens[req2.data.id] = { access_token: req.data.access_token, refresh_token: req.data.refresh_token }
                fs.writeFile("./discordTokens.json", JSON.stringify(discordTokens, null, 4), 'utf8', function (err) {
                    if (err) {
                        console.log("An error occured while writing JSON Object to File.");
                        return console.log(err);
                    }

                    console.log("JSON file has been saved.");
                }); */
                function generateUniqueSessionId() {
                    var session_id = crypto.randomBytes(16).toString('base64');
                    if (sessions[session_id]) return generateUniqueSessionId()
                    return session_id
                }
                var session_id = generateUniqueSessionId()
                console.log("New Session ID: "+session_id)
                res.cookie('sessionId',session_id, { maxAge: 900000 });
                return res.sendFile("/home/pixel/discordbot/ComfyMusicV3/public/main.html")

            }).catch(e => {
                console.log(e)
            })

        }).catch(e => {
            console.log(e.response.data)
            if (e.response.data.error == "invalid_grant") {
                res.redirect('https://discord.com/api/oauth2/authorize?' +
                    new URLSearchParams({
                        client_id: clientId,
                        redirect_uri: 'http://pixelboop.net:3000/discord/callback',
                        response_type: 'code',
                        scope: 'identify email connections guilds'
                    }).toString());
            } else {
                res.end("Unknown error please report to pixel:\n" + e.response.data)
            }
        })
    }
};