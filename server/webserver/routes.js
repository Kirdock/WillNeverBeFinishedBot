'use strict';

const multer  = require('multer')
const path = require('path');
const fileHelper = require('../services/fileHelper.js')();
const nanoid = require('nanoid');

module.exports = function (router, logger, discordClient, config, databaseHelper) {
  const clientHelper = require('../services/clientHelper.js')(discordClient);
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
      userHelper.login(req.body.code, req.body.redirectUrl).then(authToken =>{
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
          clientHelper.getServersWhereAdmin(result.user.id, result.user.owner).then(servers =>{
            if(servers && servers.length > 0){
              res.status(200).json(databaseHelper.getLog(servers));
            }
            else{
              notAdmin(res);
            }
          }).catch(()=>{
            notAdmin(res);
          });
        }
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/servers')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        return clientHelper.getUserServers(result.user.id,result.user.owner).then(servers =>{
          res.status(200).json(servers);
        });
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/serverInfo')
		.post(function (req, res) {
      userHelper.auth(req).then(result =>{
        if(result.user.owner){
          databaseHelper.udpateServerInfo(req.body.serverInfo)
          res.status(200).json();
        }
        else{
          return clientHelper.isUserAdminInServer(result.user.id,req.body.serverInfo.id).then(guild =>{
            if(guild){
              databaseHelper.udpateServerInfo(req.body.serverInfo)
              res.status(200).json();
            }
            else{
              notAdmin(res);
            }
          });
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
        return clientHelper.isUserInServer(result.user.id, req.params.serverId, result.user.owner).then(status =>{
          if(status){
            playSound.stopPlaying(req.params.serverId).then(result =>{
              res.status(200).json(result);
            }).catch(error =>{
              res.status(500).json(error);
            });
          }
          else{
            notInServer(res, result.user.id, req.params.serverId);
          }
        });
      }).catch(error =>{
        loginFailed(res, error);
      })
      
    });

    router.route('/sounds')
		.get(function (req, res) {
      userHelper.auth(req).then((result) =>{
        return clientHelper.getUserServers(result.user.id, result.user.owner).then(servers =>{
          res.status(200).json(databaseHelper.getSoundsMeta(servers));
        });
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/sound/:soundId')
		.get(function (req, res) {
      userHelper.auth(req).then((result) =>{
        const meta = databaseHelper.getSoundMeta(req.params.soundId);
        if(meta){
          return clientHelper.isUserInServer(result.user.id, meta.serverId, result.user.isOwner).then(status =>{
            if(status){
              res.status(200).download(meta.path, meta.fileName + path.extname(meta.path));
            }
            else{
              res.status(404).json();
            }
          });
        }
        else{
          res.status(404).json();
        }
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/sounds/:serverId')
		.get(function (req, res) {
      userHelper.auth(req).then((result) =>{
        return clientHelper.isUserInServer(result.user.id,req.params.serverId, result.user.owner).then(status =>{
          if(status){
            res.status(200).json(databaseHelper.getSoundsMeta([{id:req.params.serverId}]));
          }
          else{
            notInServer(res, result.user.id, req.params.serverId);
          }
        });
      }).catch(error =>{
        loginFailed(res, error);
      })
    });

    router.route('/playSound')
		.post(function (req, res) {
      userHelper.auth(req).then(auth =>{
        return clientHelper.isUserInServer(auth.user.id, req.body.serverId, auth.user.owner).then(status =>{
          if(status){
            if(!auth.user.owner && req.body.volume >= 1){
              req.body.volume = 1;
            }
            
            const guild = discordClient.guilds.cache.get(req.body.serverId);
            clientHelper.validJoin(req.body.joinUser, req.body.serverId, req.body.channelId, guild, auth.user.id).then(channelId =>{
              if(req.body.soundId){
                const meta = databaseHelper.getSoundMeta(req.body.soundId);
                if(meta){
                  databaseHelper.logPlaySound(auth.user, guild.id, guild.name, meta);
                  playSound.requestSound(meta.path, req.body.serverId, channelId, req.body.volume).then(response =>{
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
                playSound.requestYoutube(req.body.url, req.body.serverId, channelId, req.body.volume).then(response =>{
                  res.status(200).json(response);
                }).catch(error =>{
                  logger.error(error, 'requestSound');
                  res.status(404).json(error);
                })
              }
            }).catch(() =>{
              res.status(400).json();
            });
            
            
          }
          else{
            notInServer(res, auth.user.id, req.body.serverId);
          }
        });
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
        return clientHelper.isUserInServer(result.user.id, req.params.id, result.user.owner).then(status =>{
          if(status){
              const channels = discordClient.guilds.cache.get(req.params.id).channels.cache.filter(channel => channel.type === 'voice').sort((channel1, channel2) => channel1.rawPosition  - channel2.rawPosition ).map(item =>{return {id: item.id, name: item.name}})
              res.status(200).json(channels);
          }
          else{
            notInServer(res, result.user.id, req.params.id);
          };
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
        return clientHelper.isUserInServer(result.user.id, req.body.serverId, result.user.owner).then(status =>{
          if(status){
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
        })
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
      userHelper.auth(req).then(auth =>{
        const meta = databaseHelper.getSoundMeta(req.body.soundId);
        const soundId = meta ? req.body.soundId : undefined;
        if(req.body.userId){
          clientHelper.isUserAdminWhereAnotherUser(auth.user.id, req.body.userId, auth.user.owner, req.body.serverId).then(status =>{
            const id = status ? req.body.userId : auth.user.id;
            if(meta && req.body.serverId == meta.serverId || !meta){
              databaseHelper.setIntro(id,soundId,req.body.serverId);
              res.status(200).json();
            }
            else{
              res.status(500).json();
            }
          });
        }
        else if(meta && meta.serverId == req.body.serverId || !meta){
          clientHelper.isUserInServer(auth.user.id,req.body.serverId).then(status =>{
            if(status){
              databaseHelper.setIntro(auth.user.id,soundId,req.body.serverId);
              res.status(200).json();
            }
            else{
              res.status(500).json();
            }
          }).catch(()=>{
            res.status(500).json();
          });
        }
        else{
          res.status(500).json();
        }
      }).catch(error =>{
        loginFailed(res, error);
      });
    });

    router.route('/user/:serverId')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        return clientHelper.getUser(result.user.id).then(user =>{
          res.status(200).json(databaseHelper.getUserInfo(user, req.params.serverId));
        });
      }).catch(error =>{
        loginFailed(res, error);
      });
    });

    router.route('/hasAdminServers')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        return clientHelper.hasUserAdminServers(result.user.id, result.user.owner);
      })
      .then(status => {
        res.status(200).json(status);
      })
      .catch(error =>{
        loginFailed(res, error);
      });
    });

    router.route('/users/:serverId')
		.get(function (req, res) {
      userHelper.auth(req).then(result =>{
        if(result.user.owner){
          return clientHelper.getUsers(req.params.serverId).then(users =>{
            res.status(200).json(databaseHelper.getUsersInfo(users, req.params.serverId));
          });
        }
        else{
          clientHelper.getUsersWhereIsAdmin(result.user.id, result.user.owner, discordClient.guilds.cache).then(users =>{
            res.status(200).json(databaseHelper.getUsersInfo(users, req.params.serverId));
          })
          .catch(()=>{
            notAdmin(res);
          })
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

    function getServerName(serverId){
      let name;
      const server = discordClient.guilds.cache.get(serverId);
      if(server){
        name = server.name;
      }
      return name;
    }
}