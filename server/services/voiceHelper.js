'use strict'

const q = require('q');

module.exports = (client) =>{
    let voiceHelper = {
        joinVoiceChannel: joinVoiceChannel,
        disconnectVoice: disconnectVoice,
        hasConnection: hasConnection,
        getConnection: getConnection,
        joinVoiceChannelById: joinVoiceChannelById
    };

    return voiceHelper;


    function joinVoiceChannel(message){
        if (message.member.voice.channel) {
            return message.member.voice.channel.join();
        }
        else
        {
            return q.reject({message:'I konn nit joinen du Volltogga!'});
        }
    }

    function joinVoiceChannelById(serverId, clientId){
        const server = client.guilds.cache.get(serverId);
        let defer = q.defer();
        if(server){
            const channel = server.channels.cache.get(clientId);
            if(channel){
                defer.resolve(channel.join());
            }
            else{
                defer.reject(new Error("ChannelId not found"));
            }
        }
        else{
            defer.reject(new Error("ServerId not found"));
        }
        return defer.promise;
    }

    function hasConnection(id){
        return client.voice.connections.has(id);
    }

    function getConnection(id){
        return client.voice.connections.get(id);
    }

    //serverID == key for voiceConnections
    function disconnectVoice(id){
        let connection = client.voice.connections.get(id);
        if(connection){
            connection.disconnect();
        }
    }
}