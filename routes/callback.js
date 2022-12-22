const { default: axios } = require("axios");
const { sp_id, sp_secret } = require('../config.json');
const fs = require("fs")

module.exports = {
    request: "get",
    /** @type {import("express").RequestHandler} */
    execute(req, res) {
        var { tokens } = require("../index.js")
        var code = req.query.code || null;
        var bodyFormData = new URLSearchParams();
        bodyFormData.append('code', req.query.code);
        bodyFormData.append('redirect_uri', 'http://pixelboop.net:3000/callback');
        bodyFormData.append('grant_type', 'authorization_code');

        console.log(sp_id, sp_secret)

        console.log("HERE")

        axios.post("https://accounts.spotify.com/api/token", bodyFormData, {
            headers: {
                'Authorization': 'Basic ' + (new Buffer(sp_id + ':' + sp_secret).toString('base64'))
            }
        }).then(req=>{
            console.log("WOOOO")
            console.log(req.data)

            axios.get("https://api.spotify.com/v1/me", {
                headers: {
                    'Authorization': 'Bearer ' + req.data.access_token
                }
            }).then(req2=>{
                console.log(req2.data.id)
                tokens[req2.data.id] = { access_token: req.data.access_token, refresh_token: req.data.refresh_token, date: new Date() }
                fs.writeFile("./tokens.json", JSON.stringify(tokens, null, 4), 'utf8', function (err) {
                    if (err) {
                        console.log("An error occured while writing JSON Object to File.");
                        return console.log(err);
                    }
                 
                    console.log("JSON file has been saved.");
                });
            }).catch(e => {
                console.log(e)
            })

        }).catch(e => {
            console.log(e)
        })
    }
};