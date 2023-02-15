const { clientId } = require('../../config.json');
const querystring = require('node:querystring');

module.exports = {
    request: "get",
    execute(req, res) {
        var scope = 'user-read-private user-read-email';

        res.redirect('https://discord.com/api/oauth2/authorize?' +
            querystring.stringify({
                client_id: clientId,
                redirect_uri: 'https://v3.pixelboop.net/api/discord/callback',
                response_type: 'code',
                scope: 'identify email connections guilds'
            }));
    },
};