const fs = require("fs")
module.exports = {
    name: 'messageCreate',
    once: false,
    /** 
   * @param {Discord.Message} msg
   */
    
    execute(msg) {
        console.log(`[${msg.guild.name}] ${msg.author.username}: ${msg.content}`)
    },
};
