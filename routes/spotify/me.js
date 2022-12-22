module.exports = {
    request: "get",
    execute(req, res) {
        var { tokens } = require("../../index.js")
        console.log(tokens)
        res.end("Wooohoodasdadao it works?????")
    },
};