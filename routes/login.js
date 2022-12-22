const { sp_id } = require('../config.json');
const querystring = require('node:querystring');

module.exports = {
    request: "get",
    execute(req, res) {
        var scope = 'user-read-private user-read-email';

        res.redirect('https://accounts.spotify.com/authorize?' +
            querystring.stringify({
                response_type: 'code',
                client_id: sp_id,
                scope: 'user-read-private user-read-email',
                redirect_uri: 'http://pixelboop.net:3000/callback',
            }));
    },
};