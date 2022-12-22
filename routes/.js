module.exports = {
    request: "get",
    execute(req, res) {
        console.log(req.cookies)
        res.end("Wooohoodasdadao it works?????")
    },
};