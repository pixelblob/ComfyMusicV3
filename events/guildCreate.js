module.exports = {
    name: 'guildCreate',
    once: false,
    /** 
   * @param {Discord.Guild} guild
   */
    execute(guild) {
        console.log(guild)
        var { queues } = require("../index")

        queues[guild.id] = { current: null, queue: [], position: null, queueSize: 0 }
    },
};
