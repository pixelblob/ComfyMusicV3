module.exports = { CreatePXRoutes, CreateCommandRoutes }

const fs = require("fs")
const { app, client, routes } = require("../index.js")
const express = require('express')

app.use(express.json());
const { InteractionResponse } = require("discord.js")

function recurseReadDir(dir) {
    var files = []
    var routeFiles = fs.readdirSync(dir);
    for (const routeFile of routeFiles) {
        var stat = fs.statSync(dir + "/" + routeFile);
        if (stat && stat.isDirectory()) {
            files = files.concat(recurseReadDir(dir + "/" + routeFile));
        } else {
            files.push(dir + "/" + routeFile);
        }
    }
    return files
}

app.use(express.static('public'))

function CreateCommandRoutes() {
    console.log("CreateCommandRoutes")
    var files = recurseReadDir('./commands')
    files.forEach(file => {
        if (file.endsWith(".js")) {
            file = "." + file
            console.log("FILE: " + file)
            const route = requireUncached(file);
            console.log(route)
            const path = file.replace("../commands", "").replace(".js", "")
            route.path = path
            client.routes.set(path, route);

            app.post("/commands"+path, (req, res)=>{

                console.log(req.body)

                var interaction = {}
                interaction.options={}
                interaction.options.getString = function(s) {
                    return req.body.options[s]
                }

                interaction.reply=function(m){
                    return res.end(m)
                }

                interaction.update=function(m){

                }

                interaction.member = client.guilds.cache.get(req.body.guildId).members.cache.get(req.body.userId)
                interaction.guild = client.guilds.cache.get(req.body.guildId)

                route.execute(interaction).catch(error=>{
                    console.log(error)
                res.end(error.toString())
                })
            })
        }
    })
    app.get("/commands", (req, res)=>{
        res.json(client.commands.map(c=> c.data.name))
    })
}

//handles routes
function CreatePXRoutes() {
    var files = recurseReadDir('./routes')
    files.forEach(file => {
        if (file.endsWith(".js")) {
            file = "." + file
            console.log("FILE: " + file)
            const route = requireUncached(file);
            console.log(route)
            const path = file.replace("../routes", "").replace(".js", "")
            route.path = path
            client.routes.set(path, route);
            try {
                if (route.request == "get") {
                console.log("GET REQ: " + path)
                app.get(path, (...args) => route.execute(...args))
            } else if (route.request == "put") {
                app.put(path, (...args) => route.execute(...args))
            } else if (route.request == "post") {
                app.post(path, (...args) => route.execute(...args))
            } else if (route.request == "delete") {
                app.delete(path, (...args) => route.execute(...args))
            } else if (route.request == "patch") {
                app.patch(path, (...args) => route.execute(...args))
            } else if (route.request == "options") {
                app.options(path, (...args) => route.execute(...args))
            }
            } catch (error) {
                console.log(error)
            }
            
        }
    })
    console.log(`Found ${client.routes.size} Routes: [${client.routes.map(e => e.path).join(", ")}]`)

    //console.log(app._router.stack)

}

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}