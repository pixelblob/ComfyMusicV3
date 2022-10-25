const fs = require("fs")
module.exports = {
    name: 'messageCreate',
    once: false,
    execute(msg) {
        console.log("MESSAGE: "+msg.content)
    },
};
