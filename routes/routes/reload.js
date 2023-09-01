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
            var oldroute = app["_router"].stack.findIndex(r => r.route?.path == route.path)
            if (oldroute >= 0) {
                app["_router"].stack.splice(oldroute, 1)
                client.routes.delete(route.path)
                try {
                    var thing = require.resolve(`..${route.path}.js`)
                    delete require.cache[thing];
                } catch (error) {
                    console.log("Failed to get: " + route.path)
                }
            }
        });

        setTimeout(() => {
            const { CreatePXRoutes } = require("../../util/pxRoute.js")
            CreatePXRoutes()

            res.end()
        }, 50);
    },
};