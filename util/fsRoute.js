const fs = require("fs")
module.exports = {CreateRoutes}

function getCallerFilePath(path) {
    let stack = new Error().stack.split('\n')
    return stack[2].slice(
        stack[2].lastIndexOf('(')+1, 
        stack[2].lastIndexOf('.js')+3
    )
}

function CreateRoutes() {
    const files = fs.readdirSync(__dirname + "/routes")
    for (file of files) {
        console.log("Loading route: " + file)
    }
}

