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
                scope: 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control streaming user-library-read',
                redirect_uri: 'https://v3.pixelboop.net/api/callback',
            }));
    },
};