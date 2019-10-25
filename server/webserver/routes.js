'use strict';

const multer  = require('multer')
const path = require('path');
const fileHelper = require('../services/fileHelper.js')();

module.exports = function (router, logger, discordClient, config) {

  const voiceHelper = require('../services/voiceHelper.js')(discordClient);
  const playSound = require('../modules/playSound.js')(config,logger,voiceHelper);
  const updateHelper = require('../services/updateHelper.js')(config, logger);
  const userHelper = require('../services/userHelper.js')(config);
  const databaseHelper = require('../services/databaseHelper.js')();
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(fileHelper.soundFolder))
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  });
  const upload = multer({storage: storage});

    router.route('/login')
    .post(function (req, res) {
      userHelper.login(req.body.code, req.body.redirectUrl, getBotServers()).then(authToken =>{
        res.status(200).json(authToken);
      }).catch(error =>{
        console.log(error);
        res.status(401).json({message: 'Authentication failed'});
      })
    });

    router.route('/log')
    .get(function (req, res){
      userHelper.auth(req).then(result =>{
        if(result.user.admin){
          res.status(200).json(databaseHelper.getLog());
        }
        else{
          notAdmin(res);
        }
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/servers')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        userHelper.getServersEquivalent(result.user, getBotServers())
          .then(result =>{
            res.status(200).json(result);
          })
          .catch(error =>{
            console.log(error);
            res.status(404).json();
          })
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/updateServer')
    .get(function (req, res) {
      userHelper.auth(req).then(result =>{
        userHelper.updateServers(result.user, getBotServers()).then(() =>{
          userHelper.getServersEquivalent(result.user, getBotServers())
            .then(servers =>{
              res.status(200).json(servers);
            })
            .catch(error =>{
              console.log(error);
              res.status(404).json();
            });
        }).catch(error =>{
          console.log(error);
          res.status(403).json();
        });
      }).catch(error =>{
        loginFailed(res, error);
      });
    });

    router.route('/updateWebsite')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        if(result.user.admin){
          updateHelper.updateWebsite().then(result =>{
            res.status(200).json(result);
          }).catch(error =>{
            res.status(500).json(error);
          })
        }
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/stopPlaying/:serverId')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        userHelper.isInServer(result.user, req.params.serverId).then(() =>{
          playSound.stopPlaying(req.params.serverId).then(result =>{
            res.status(200).json(result);
          }).catch(error =>{
            res.status(500).json(error);
          })
        }).catch(error =>{
          notInServer(res, error);
        });
      }).catch(error =>{
        loginFailed(res, error);
      })
      
    });

    router.route('/sounds')
		.get(function (req, res) {
      userHelper.auth(req).then(() =>{
        res.status(200).json(databaseHelper.getSoundsMeta());
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/playSound')
		.post(function (req, res) {
      userHelper.auth(req).then(auth =>{
        userHelper.isInServer(auth.user, req.body.serverId).then(result =>{
          if(!auth.user.admin && req.body.volume >= 1){
            req.body.volume = 1;
          }
          let validJoin = true;
          const guild = discordClient.guilds.get(req.body.serverId);
          databaseHelper.log(auth.user, guild.name, 'Play Sound');
          if(req.body.joinUser){
            if(guild){
              const member = guild.members.get(auth.user.id);
              if(member.guild.id == req.body.serverId && member.voice && member.voice.channel){
                req.body.channelId = member.voice.channelID;
              }
              else{
                validJoin = false;
                res.status(400).json();
              }
            }
            else{
              validJoin = false;
              res.status(400).json();
            }
          }
          if(validJoin){
            if(req.body.id){
              playSound.requestSound(databaseHelper.getSoundMeta(req.body.id).path, req.body.serverId, req.body.channelId, req.body.volume).then(response =>{
                res.status(200).json(response);
              }).catch(error =>{
                logger.error(error, 'requestSound');
                res.status(404).json(error);
              })
            }
            else{
              playSound.requestYoutube(req.body.url, req.body.serverId, req.body.channelId, req.body.volume).then(response =>{
                res.status(200).json(response);
              }).catch(error =>{
                logger.error(error, 'requestSound');
                res.status(404).json(error);
              })
            }
          }
        }).catch(error =>{
          notInServer(res, error);
        })
      }).catch(error =>{
        loginFailed(res, error);
      })
      
    });

    router.route('/channels/:id')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        userHelper.isInServer(result.user, req.params.id).then(() =>{
          res.status(200).json(discordClient.guilds.get(req.params.id).channels.filter(channel => channel.type === 'voice').sort((channel1, channel2) => channel1.rawPosition  - channel2.rawPosition ).map(item =>{return {id: item.id, name: item.name}}));
        }).catch(error =>{
          notInServer(res, error);
        });
      }).catch(error =>{
        loginFailed(res, error);
      });
    });

    router.route('/soundCategories')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        res.status(200).json(databaseHelper.getSoundCategories());
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/uploadFile')
    .put(upload.array('files'),function (req, res){
      userHelper.auth(req).then(result =>{
        //maybe temp folder for uploaded files?
        //override when there is a name conflict...
        databaseHelper.addSoundsMeta(req.files,result.user,req.body.category);
        res.status(200).json();
      }).catch(error =>{
        fileHelper.deleteFiles(req.files).then(()=>{
          loginFailed(res, error);
        }).catch(error =>{
          logger.log(error,'DeleteFiles');
          loginFailed(res, error);
        })
      });
    });
    
    router.route('/users')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        if(result.user.admin){
          res.status(200).json(discordClient.users.map(item =>{return {id: item.id, name: item.username, status: item.presence.status}}));
        }
        else{
          notAdmin(res);
        }
      }).catch(error =>{
        loginFailed(res, error);
      });
    });

    router.route('/addcat/:catname')
    .put(function (req, res) {
      userHelper.auth(req).then(result =>{
        res.status(200).json(fileHelper.createCatFolder(req.params.catname));
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    function loginFailed(res, error){
      console.log('Login failed',error.error || error);
      res.status(error.status || 401).json(error.message || 'Authentication failed');
    }

    function notInServer(res, error){
      if(error !== false){
        console.log(error);
      }
      res.status(403).json({message: 'Du host auf den Server kan Zugriff!!'});
    }

    function notAdmin(res){
      res.status(403).json({message: 'Nur der Hochadel hat Zugriff auf diese Funktion'});
    }

    function getBotServers(){
      return discordClient.guilds.map(item =>{return {id: item.id, name: item.name}});
    }
}