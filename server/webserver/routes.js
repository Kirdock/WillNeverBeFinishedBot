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
        if(result.user.owner){
          res.status(200).json(databaseHelper.getLog());
        }
        else{
          const servers = getUserServers(result.user.id).filter(server => server.admin);
          if(servers && servers.length > 0){
            res.status(200).json(databaseHelper.getLog(servers));
          }
          else{
            notAdmin(res);
          }
        }
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/servers')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        res.status(200).json(getUserServers(result.user.id));
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/serverInfo')
		.post(function (req, res) {
      userHelper.auth(req).then(result =>{
        if(isUserAdmin(result.user.id,req.body.serverInfo.id)){
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
        if(result.user.owner){
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
      userHelper.auth(req).then((result) =>{
        res.status(200).json(databaseHelper.getSoundsMeta(getUserServers(result.user.id)));
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/sounds/:serverId')
		.get(function (req, res) {
      userHelper.auth(req).then((result) =>{
        if(isUserInServer(result.user.id,req.params.serverId)){
          res.status(200).json(databaseHelper.getSoundsMeta([{id:req.params.serverId}]));
        }
        else{
          notInServer(res, result.user.id, req.params.serverId);
        }
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/playSound')
		.post(function (req, res) {
      userHelper.auth(req).then(auth =>{
        if(isUserInServer(auth.user.id, req.body.serverId)){
          if(!auth.user.owner && req.body.volume >= 1){
            req.body.volume = 1;
          }
          let validJoin = true;
          const guild = discordClient.guilds.get(req.body.serverId);
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
              const meta = databaseHelper.getSoundMeta(req.body.soundId);
              if(meta){
                databaseHelper.logPlaySound(auth.user, guild.id, guild.name, meta);
                playSound.requestSound(meta.path, req.body.serverId, req.body.channelId, req.body.volume).then(response =>{
                  res.status(200).json(response);
                }).catch(error =>{
                  logger.error(error, 'requestSound');
                  res.status(404).json(error);
                });
              }
              else{
                res.status(404).json();
              }
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
        if(meta && (meta.user.id === result.user.id || result.user.owner)){
          const filePath = meta.path;
          databaseHelper.removeSoundMeta(req.params.id, getServerName(meta.serverId));
          fileHelper.deleteFile(filePath).then(()=>{
            res.status(200).json();
          }).catch(error =>{
            logger.error(error,'DeleteFile');
            databaseHelper.addSoundMeta(meta.id, meta.path, meta.fileName, meta.user, meta.category, meta.serverId);
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
        if(isUserAdmin(result.user.id, req.body.serverId)){
          let addedFiles = databaseHelper.addSoundsMeta(req.files,result.user,req.body.category, req.body.serverId, getServerName(req.body.serverId));
          res.status(200).json(addedFiles);
        }
        else{
          fileHelper.deleteFiles(req.files).then(()=>{
            notAdmin(res);
          }).catch(error =>{
            logger.log(error,'DeleteFiles');
            loginFailed(res, error);
          })
        }
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
        const meta = databaseHelper.getSoundMeta(req.body.soundId);
        const id = req.body.userId && (result.user.owner || isUserAdminWhereAnotherUser(result.user.id, req.body.userId)) ? req.body.userId : result.user.id;
        if(isUserInServer(id,meta.serverId)){
          databaseHelper.setIntro(id, req.body.soundId);
        }
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

    router.route('/hasAdminServers')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        res.status(200).json(hasUserAdminServers(result.user.id));
      }).catch(error =>{
        loginFailed(res, error);
      });
    });

    router.route('/users')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        if(result.user.owner){
          res.status(200).json(databaseHelper.getUsersInfo(getUsers()));
        }
        else{
          const users = getUsersWhereIsAdmin(result.user.id);
          if(users && users.length > 0){
            res.status(200).json(databaseHelper.getUsersInfo(users));
          }
          else{
            notAdmin(res);
          }
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
      logger.warn({userId,serverId},'User not in server');
      res.status(403).json({message: 'Du host auf den Server kan Zugriff!!'});
    }

    function notAdmin(res){
      res.status(403).json({message: 'Nur der Hochadel hat Zugriff auf diese Funktion'});
    }

    function getUsers(){
      return discordClient.users.map(user =>{
        return getUser(user.id, user);
      }).sort((a,b) => a.name.localeCompare(b.name));
    }

    function getUsersWhereIsAdmin(userId){
      return discordClient.guilds
        .filter(guild => guild.members.get(userId) && guild.members.get(userId).permissions.has('ADMINISTRATOR')) //get all guilds where user is admin
        .map(guild => guild.members).reduce((a,b) => a.concat(b)) //return all members (select many)
        .map(member => getUser(member.user.id, member.user)) //return all users
        .sort((a,b) => a.name.localeCompare(b.name));
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
          let server = {
            id: guild.id,
            icon: guild.icon,
            name: guild.name,
            permissions: member.permissions.bitfield,
            admin: member.permissions.has('ADMINISTRATOR') && userId !== '113148827338289152' //exclude Berni/Xenatra
          };
          if(server.admin){
            server = {...databaseHelper.getServerInfo(guild.id), ...server};
          }
          servers.push(server);
        }
      });
      return servers;
    }

    function isUserInServer(userId, serverId){
      const server = discordClient.guilds.get(serverId);
      return !!(server && server.members.get(userId));
    }

    function isUserAdmin(userId, serverId){
      let status = false;
      const server = discordClient.guilds.get(serverId);
      if(server){
        const member = server.members.get(userId);
        status = member && member.permissions.has('ADMINISTRATOR') && member.id !== '113148827338289152';
      }
      return status;
    }

    function hasUserAdminServers(userId){
      return getUserServers(userId).some(server => server.admin);
    }

    function isUserAdminWhereAnotherUser(userIdAdmin, userId){
      const adminServers = getUserServers(userIdAdmin);
      let status = false;
      if(adminServers && adminServers.length > 0){
        status = adminServers.some(server => server.admin && isUserInServer(userId));
      }
      return status;
    }

    function getServerName(serverId){
      let name;
      const server = discordClient.guilds.get(serverId);
      if(server){
        name = server.name;
      }
      return name;
    }
}