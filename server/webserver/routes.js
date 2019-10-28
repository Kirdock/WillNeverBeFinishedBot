'use strict';

const multer  = require('multer')
const path = require('path');
const fileHelper = require('../services/fileHelper.js')();
const nanoid = require('nanoid');

module.exports = function (router, logger, discordClient, config, databaseHelper) {

  const voiceHelper = require('../services/voiceHelper.js')(discordClient);
  const playSound = require('../modules/playSound.js')(config,logger,voiceHelper);
  const updateHelper = require('../services/updateHelper.js')(config, logger);
  const userHelper = require('../services/userHelper.js')(config);
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, fileHelper.soundFolder)
    },
    filename: function (req, file, cb) {
      cb(null, nanoid()+path.extname(file.originalname))
    }
  });
  const upload = multer({storage: storage});

    router.route('/login')
    .post(function (req, res) {
      userHelper.login(req.body.code, req.body.redirectUrl, getUserServers).then(authToken =>{
        res.status(200).json(authToken);
      }).catch(error =>{
        logger.error(error,'Login');
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
        if(result.user.admin){
          res.status(200).json(getBotServerInfos());
        }
        else{
            res.status(200).json(getUserServers(result.user.id));
        }
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/serverInfo')
		.post(function (req, res) {
      userHelper.auth(req).then(result =>{
        if(result.user.admin){
          databaseHelper.udpateServerInfo(req.body.serverInfo)
          res.status(200).json();
        }
        else{
          notAdmin(res);
        }
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
        if(isUserInServer(result.user.id, req.params.serverId)){
          playSound.stopPlaying(req.params.serverId).then(result =>{
            res.status(200).json(result);
          }).catch(error =>{
            res.status(500).json(error);
          });
        }
        else{
          notInServer(res, result.user.id, req.params.serverId);
        };
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
        if(isUserInServer(auth.user.id, req.body.serverId)){
          if(!auth.user.admin && req.body.volume >= 1){
            req.body.volume = 1;
          }
          let validJoin = true;
          const guild = discordClient.guilds.get(req.body.serverId);
          databaseHelper.logPlaySound(auth.user, guild.name, 'Play Sound');
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
            if(req.body.soundId){
              playSound.requestSound(databaseHelper.getSoundMeta(req.body.soundId).path, req.body.serverId, req.body.channelId, req.body.volume).then(response =>{
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
        }
        else{
          notInServer(res, auth.user.id, req.body.serverId);
        }
      }).catch(error =>{
        loginFailed(res, error);
      })
      
    });

    router.route('/deleteSound/:id')
    .delete(function (req, res){
      userHelper.auth(req).then((result) =>{
        const meta = databaseHelper.getSoundMeta(req.params.id);
        if(meta && (meta.user.id === result.user.id || result.user.admin)){
          const filePath = meta.path;
          databaseHelper.removeSoundMeta(req.params.id);
          fileHelper.deleteFile(filePath).then(()=>{
            res.status(200).json();
          }).catch(error =>{
            logger.error(error,'DeleteFile');
            databaseHelper.addSoundMeta(meta.id, meta.path, meta.fileName, meta.user, meta.category);
            res.status(500).json();
          }).catch(error =>{
            logger.error(error,'AddSoundMeta');
            res.status(500).json();
          })
        }
        else{
          res.status(403).json();
        }
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/channels/:id')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        if(isUserInServer(result.user.id, req.params.id)){
          res.status(200).json(discordClient.guilds.get(req.params.id).channels.filter(channel => channel.type === 'voice').sort((channel1, channel2) => channel1.rawPosition  - channel2.rawPosition ).map(item =>{return {id: item.id, name: item.name}}));
        }
        else{
          notInServer(res, result.user.id, req.params.id);
        };
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
        let addedFiles = databaseHelper.addSoundsMeta(req.files,result.user,req.body.category);
        res.status(200).json(addedFiles);
      }).catch(error =>{
        fileHelper.deleteFiles(req.files).then(()=>{
          loginFailed(res, error);
        }).catch(error =>{
          logger.log(error,'DeleteFiles');
          loginFailed(res, error);
        })
      });
    });

    router.route('/setIntro')
		.post(function (req, res) {
      userHelper.auth(req).then(result =>{
        const id = req.body.userId && result.user.admin ? req.body.userId : result.user.id;
        databaseHelper.setIntro(id, req.body.soundId);
        res.status(200).json();
      }).catch(error =>{
        loginFailed(res, error);
      });
    });

    router.route('/user')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        res.status(200).json(databaseHelper.getUserInfo(getUser(result.user.id)));
      }).catch(error =>{
        loginFailed(res, error);
      });
    });
    
    router.route('/users')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        if(result.user.admin){
          res.status(200).json(databaseHelper.getUsersInfo(getUsers()));
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
      logger.error(error.error || error, 'Login failed');
      res.status(error.status || 401).json(error.message || 'Authentication failed');
    }

    function notInServer(res, userId, serverId){
      logger.warning({userId,serverId},'User not in server');
      res.status(403).json({message: 'Du host auf den Server kan Zugriff!!'});
    }

    function notAdmin(res){
      res.status(403).json({message: 'Nur der Hochadel hat Zugriff auf diese Funktion'});
    }

    function getBotServers(){
      return discordClient.guilds.map(guild =>{
        return {
          id: guild.id,
          name: guild.name
        }
      });
    }

    function getBotServerInfos(){
      return databaseHelper.getServersInfo(getBotServers());
    }

    function getUsers(){
      return discordClient.users.map(user =>{
        return getUser(user.id, user);
      }).sort((a,b) => a.name.localeCompare(b.name));
    }

    function getUser(userId, userLoaded){
      const user = userLoaded || discordClient.users.get(userId);
      const servers = getUserServers(userId);
      return user ? {
        id: user.id,
        name: user.username,
        servers: servers
      } : undefined;
    }

    function getUserServers(userId){
      let servers = [];
      discordClient.guilds.forEach(guild =>{
        const member = guild.members.get(userId);
        if(member){
          servers.push({
            id: guild.id,
            icon: guild.icon,
            name: guild.name,
            permissions: member.permissions.bitfield,
            admin: member.permissions.has('ADMINISTRATOR')
          });
        }
      });
      return servers;
    }

    function isUserInServer(userId, serverId){
      const server = discordClient.guilds.get(serverId);
      return server && server.members.get(userId);
    }
}