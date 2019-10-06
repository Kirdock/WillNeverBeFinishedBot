'use strict';


module.exports = function (router, logger, discordClient, config) {
    router.route('/something')
		.get(function (req, res) {
            console.log(req.params);
        });
}