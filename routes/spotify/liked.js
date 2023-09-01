const axios = require("axios")

module.exports = {
    request: "get",
    async execute(req, res) {
        var { tokens, discordTokens, sessions, getSpotifyAccessToken } = require("../../index.js")
        console.log(tokens)



        var session = sessions[req.cookies.sessionId]
        if (session) {
            console.log(session)

            var discordLogin = discordTokens[session.userId]

            var spotifyLogin = tokens[discordLogin.spotifyId]
            if (spotifyLogin) {
                console.log("SPOTIFY")
                console.log(spotifyLogin)
                var spotifyAccessToken = await getSpotifyAccessToken(discordLogin.spotifyId)
                console.log(spotifyAccessToken)

                var data = (await axios.get(`https://api.spotify.com/v1/me/tracks?offset=0&limit=50`, {
                    headers: {
                        authorization: "Bearer " + (spotifyAccessToken)
                    }
                })).data

                res.json(data)

            }

        }

        //res.end("Wooohoodasdadao it works?????")
    },
};