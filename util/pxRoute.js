module.exports = { CreatePXRoutes }

const fs = require("fs")
const { app, client, routes } = require("../index.js")

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

//handles routes
function CreatePXRoutes() {
    var files = recurseReadDir('./routes')
    files.forEach(file => {
        if (file.endsWith(".js")) {
            file="."+file
            console.log(file)
            const route = require(file);
            const path = file.replace("../routes", "").replace(".js", "")
            route.path = path
            client.routes.set(path, route);
            if (route.request == "get") {
                console.log(path)
                app.get(path, (...args) => route.execute(...args))
            } else if (route.request == "put") {
                console.log(path)
                app.put(path, (...args) => route.execute(...args))
            } else if (route.request == "post") {
                console.log(path)
                app.post(path, (...args) => route.execute(...args))
            } else if (route.request == "delete") {
                console.log(path)
                app.delete(path, (...args) => route.execute(...args))
            } else if (route.request == "patch") {
                console.log(path)
                app.patch(path, (...args) => route.execute(...args))
            } else if (route.request == "options") {
                console.log(path)
                app.options(path, (...args) => route.execute(...args))
            }
        }
    })
}