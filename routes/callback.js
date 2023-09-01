const { default: axios } = require("axios");
const { sp_id, sp_secret } = require('../config.json');
const fs = require("fs")

module.exports = {
    request: "get",
    /** @type {import("express").RequestHandler} */
    async execute(req, res) {
        var { tokens, sessions, discordTokens, getSession, createSpotifyUser } = require("../index.js")
        var code = req.query.code || null;
        var bodyFormData = new URLSearchParams();
        bodyFormData.append('code', req.query.code);
        bodyFormData.append('redirect_uri', 'https://v3.pixelboop.net/api/callback');
        bodyFormData.append('grant_type', 'authorization_code');

        console.log(sp_id, sp_secret)

        console.log("HERE")

        console.log(req.cookies)

        var session = await getSession(req.cookies.sessionId)
        if (session) {

            try {
                let spotifyOauthData = (await axios.post("https://accounts.spotify.com/api/token", bodyFormData, {
                    headers: {
                        'Authorization': 'Basic ' + (new Buffer(sp_id + ':' + sp_secret).toString('base64'))
                    }
                })).data
                console.log("WOOOO")
                console.log(spotifyOauthData)

                let spotifyUserData = (await axios.get("https://api.spotify.com/v1/me", {
                    headers: {
                        'Authorization': 'Bearer ' + spotifyOauthData.access_token
                    }
                })).data
                console.log(spotifyUserData.id)
                //access_token: req.data.access_token, refresh_token: req.data.refresh_token, date: new Date()
                createSpotifyUser({ spotifyId: spotifyUserData.id, discordId: session.discordId, accessToken: spotifyOauthData.access_token, refreshToken: spotifyOauthData.refresh_token, date: new Date() })

                res.redirect("/")
            } catch (error) {
                console.log(error)
                res.redirect("/api/login")
            }

        } else {
            res.redirect("/api/discord/login")
        }
    }
};