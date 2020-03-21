'use strict'
const q = require('q');
const databaseHelper = require('./databaseHelper.js')();

module.exports = (client) =>{
    const clientHelper = {
        getUserServers: getUserServers,
        hasUserAdminServers: hasUserAdminServers,
        getUsersWhereIsAdmin: getUsersWhereIsAdmin,
        isUserAdminWhereAnotherUser: isUserAdminWhereAnotherUser,
        getUser: getUser,
        getUsers: getUsers,
        isUserInServer: isUserInServer,
        getServer: getServer,
        validJoin: validJoin,
        getServersWhereAdmin: getServersWhereAdmin,
        isUserAdminInServer: isUserAdminInServerThroughId
    }

    return clientHelper;

function getUserServers(userId, isOwner){
    const actions = client.guilds.cache.map(guild =>{
        return getUserServer(guild, userId, isOwner);
    })
        
    return Promise.all(actions).then(servers =>{
        return servers.filter(server => server !== false);
    });
  }

  function getUserServer(guild, userId, isOwner){
    const defer = q.defer();
    const member = guild.members.cache.get(userId);
        let server = false;
        if(member)
        {
            server = {
              id: guild.id,
              icon: guild.icon,
              name: guild.name,
              permissions: member.permissions.bitfield,
              admin: isOwner || member.permissions.has('ADMINISTRATOR') && userId !== '113148827338289152' //exclude Berni/Xenatra
            };
            if(server.admin)
            {
              server = {...databaseHelper.getServerInfo(guild.id), ...server};
            }
        }
        else if(isOwner){
            server = {
                id: guild.id,
                icon: guild.icon,
                name: guild.name,
                admin: isOwner
            };

            server = {...databaseHelper.getServerInfo(guild.id), ...server};
        }
        defer.resolve(server);
    
    return defer.promise;
  }

  function hasUserAdminServers(userId, isOwner){
    return getUserServers(userId, isOwner).then(result =>{
        return result.some(server => server.admin);
    });
  }

  function getUsersWhereIsAdmin(userId, isOwner){
      return getServersWhereAdmin(userId, isOwner).then(servers =>{
          return servers.map(guild => guild.members).reduce((a,b) => a.concat(b)) //return all members (select many)
          .map(member => getUser(member.user.id, member.user)) //return all users
          .sort((a,b) => a.name.localeCompare(b.name));
      });
  }

  function getServersWhereAdmin(userId, isOwner){
      const defer = q.defer();
      let actions;
      if(isOwner){
        defer.resolve(client.guilds.cache);
        actions = [defer];
      }
      else{
        actions = client.guilds.cache.map(guild =>{
            return isUserAdminInServer(userId, guild);
        })
      }

      return Promise.all(actions).then(servers =>{
          return servers.filter(server => server !== false);
      });
  }

  function isUserAdminInServer(userId, guild){
    return guild.members.fetch(userId).then(member =>{
        member.permissions.has('ADMINISTRATOR') ? guild : false;
    });
  }

  function isUserAdminInServerThroughId(userId, serverId){
    return client.guilds.fetch(serverId).then(server =>{
        return isUserAdminInServer(userId,server);
    });
  }

  function getUser(userId, userLoaded){
    return getSingleUser(userId, userLoaded).then(user =>{
        return getUserServers(userId, user.owner).then(servers =>{
            return {
                id: user.id,
                name: user.username,
                servers: servers
            };
        });
    });
  }

  function getUsers(serverId){
      const defer = q.defer();
      const guild = client.guilds.cache.get(serverId);
      if(guild){
        const users = guild.members.cache.map(member =>{
            return {
                id: member.id,
                name: member.user.username
            };
        })
        defer.resolve(users);
      }
      else{
          defer.reject(false);
      }

      return defer.promise;
  }

  function getSingleUser(userId, userCache){
      const defer = q.defer();
      if(userCache){
          defer.resolve(userCache);
      }
      else{
          client.users.fetch(userId).then(user =>{
              defer.resolve(user);
          })
          .catch(error =>{
              defer.reject(error);
          })
      }
    
      return defer.promise;
  }


  function isUserAdminWhereAnotherUser(userIdAdmin, userId, isOwner, serverId){
      const defer = q.defer();
      if(isOwner){
        defer.resolve(isOwner);
      }
      else{
        isUserAdminInServerThroughId(userIdAdmin, serverId).then((status)=>{
            if(status){
                isUserInServer(userId, serverId, false).then(defer.resolve);
            }
            else{
                defer.resolve(false);
            }
        });
    }
    return defer.promise;
  }

  function isUserInServer(userId, serverId, isOwner){
    const defer = q.defer();
    if(isOwner){
        defer.resolve(true);
    }
    else{
        const guild = client.guilds.cache.get(serverId);
        guild.members.fetch(userId)
        .then(()=>defer.resolve(true))
        .catch(()=> defer.resolve(false));
    }
    return defer.promise;
  }

  function getServer(serverId){
      return client.guilds.cache.get(serverId);
  }

  function validJoin(joinToUser, serverId, channelId, guild, userId){
    const defer = q.defer();
    if(joinToUser){
        if(guild){
          guild.members.fetch(userId).then(member =>{
            if(member.guild.id == serverId && member.voice && member.voice.channel){
              defer.resolve(member.voice.channelID);
            }
            else{
                defer.reject(false);
            }
          }).catch(() =>{
              defer.reject(false);
          });
        }
        else{
            defer.reject(false);
        }
    }
    else{
        defer.resolve(channelId)
    }
    return defer.promise;
}
}