'use strict';


module.exports = function (router, logger, discordClient) {
    router.route('/something')
		.get(function (req, res) {
            console.log(req.params);
        });
}