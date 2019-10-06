'use strict';


module.exports = function (router, logger, discordClient, config) {
    router.route('/servers')
		.get(function (req, res) {
      res.status(200).json(discordClient.guilds.map(item =>{return {id: item.id, name: item.name}}));
    });
}