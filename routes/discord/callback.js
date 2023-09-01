const { default: axios } = require("axios");
const { clientId, clientSecret } = require('../../config.json');
var crypto = require('crypto');
const fs = require("fs")

module.exports = {
    request: "get",
    /** @type {import("express").RequestHandler} */
    execute(req, res) {
        var code = req.query.code
        var { discordTokens, sessions, createDiscordUser, createSession } = require("../../index.js")
        axios.post("https://discord.com/api/oauth2/token", new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `https://v3.pixelboop.net/api/discord/callback`,
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
                 */
                function generateUniqueSessionId() {
                    var session_id = crypto.randomBytes(16).toString('base64');
                    //if (sessions[session_id]) return generateUniqueSessionId()
                    return session_id
                }
                var session_id = generateUniqueSessionId()
                console.log("New Session ID: " + session_id)

                /* sessions[session_id] = { creationDate: new Date(), userId: req2.data.id }

                fs.writeFile(__dirname + '/../../sessions.json', JSON.stringify(sessions, null, 2), (err) => {
                    if (err) throw err;
                    console.log('Data written to file');
                }); */

                createSession({id:session_id, discordId: req2.data.id})

                if (!discordTokens[req2.data.id]) {
                    console.log(req2.data)
                    //discordTokens[req2.data.id] = { access_token: req.data.access_token, refresh_token: req.data.refresh_token, expires_in: req.data.expires_in, tokenCreationDate: new Date() }
                    /* fs.writeFile("./discordTokens.json", JSON.stringify(discordTokens, null, 4), 'utf8', function (err) {
                        if (err) {
                            console.log("An error occured while writing JSON Object to File.");
                            return console.log(err);
                        }

                        console.log("JSON file has been saved.");
                    }); */
                    
                }

                createDiscordUser({id: req2.data.id, accessToken: req.data.access_token, refreshToken: req.data.refresh_token, expires: req.data.expires_in})

                

                res.cookie('sessionId', session_id, { maxAge: 1000 * 60 * 60 * 24 * 365 * 100 });
                return res.redirect("/")

            }).catch(e => {
                console.log(e)
            })

        }).catch(e => {
            console.log(e.response.data)
            if (e.response.data.error == "invalid_grant") {
                res.redirect('https://discord.com/api/oauth2/authorize?' +
                    new URLSearchParams({
                        client_id: clientId,
                        redirect_uri: 'https://v3.pixelboop.net/api/discord/callback',
                        response_type: 'code',
                        scope: 'identify email connections guilds'
                    }).toString());
            } else {
                res.end("Unknown error please report to pixel:\n" + e.response.data)
            }
        })
    }
};