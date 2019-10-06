'use strict';

const multer  = require('multer')
const path = require('path');
const fileHelper = require('./../services/fileHelper.js')();

module.exports = function (router, logger, discordClient, config) {

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(config.soundFolder,'uploads'))
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  });
  const upload = multer({storage: storage});

    router.route('/servers')
		.get(function (req, res) {
      res.status(200).json(discordClient.guilds.map(item =>{return {id: item.id, name: item.name}}));
    });

    router.route('/soundCategories')
		.get(function (req, res) {
      res.status(200).json(fileHelper.getDirectoriesWithName(config.soundFolder));
    });

    router.route('/uploadFile')
    .put(upload.single('file'),function (req, res){
			//req.file, JSON.parse(req.body.metadata)
		})
}