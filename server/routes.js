'use strict';

const multer  = require('multer')
const path = require('path');
const fileHelper = require('./../services/fileHelper.js')();

module.exports = function (router, logger, discordClient, config) {

  const voiceHelper = require('./../services/voiceHelper.js')(discordClient);
  const playSound = require('./../modules/playSound.js')(config,logger,voiceHelper);
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(config.soundFolder,config.uploadFolder))
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

    router.route('/sounds')
		.get(function (req, res) {
      res.status(200).json(fileHelper.getSounds());
    });

    router.route('/playSound')
		.post(function (req, res) {
      console.log(req.body)
      playSound.requestSound(req.body.path, req.body.serverId, req.body.channelId).then(response =>{
        res.status(200).json(response);
      }).catch(error =>{
        logger.error(error);
        res.status(404).json(error);
      })
      
    });

    router.route('/channels/:id')
		.get(function (req, res) {
      res.status(200).json(discordClient.guilds.get(req.params.id).channels.filter(channel => channel.type === 'voice').sort((channel1, channel2) => channel1.position > channel2.position).map(item =>{return {id: item.id, name: item.name}}));
    });

    router.route('/soundCategories')
		.get(function (req, res) {
      res.status(200).json(fileHelper.getDirectoriesWithName(config.soundFolder));
    });

    router.route('/uploadFile')
    .put(upload.single('file'),function (req, res){
      fileHelper.moveToCategory(req.file.path, req.body.category).then(result =>{
        res.status(200).json(result);
      }).catch(error =>{
        logger.error(error);
        res.status(400).json(error);
      });
    });
    
    router.route('/users')
		.get(function (req, res) {
      res.status(200).json(discordClient.users.map(item =>{return {id: item.id, name: item.username, status: item.presence.status}}));
    });

    router.route('/addcat/:catname')
    .put(function (req, res) {
      res.status(200).json(fileHelper.createCatFolder(req.params.catname));
    });
}