const {Server, Client} = require('node-osc');

const server = new Server(9000, '127.0.0.1', () => {
    console.log('OSC Server is listening');
});

const client = new Client("127.0.0.1", 9001);

module.exports = {
    server,
    client,
};