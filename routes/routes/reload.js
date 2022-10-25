const { Routes } = require('discord-api-types/v9');
const { Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require("fs")
module.exports = {
    request: "post",
    execute(req, res) {
        const { app, client } = require("../../index.js")
        console.log("Reload Routes!")
        client.routes.forEach(route => {
            console.log(route.path)
            var oldroute = app["_router"].stack.findIndex(r=> r.route?.path == route.path)
            console.log(app["_router"].stack)
            if (oldroute >= 0) {
                console.log(oldroute)
                app["_router"].stack.splice(oldroute, 1)
                client.routes.delete(route.path)
            }
        });

        const { CreatePXRoutes } = require("../../util/pxRoute.js")
        CreatePXRoutes()

        res.end()
    },
};