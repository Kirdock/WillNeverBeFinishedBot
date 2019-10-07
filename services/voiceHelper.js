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
        if (message.member.voiceChannel) {
            return message.member.voiceChannel.join();
        }
        else
        {
            return q.reject({message:'I konn nit joinen du Volltogga!'});
        }
    }

    function joinVoiceChannelById(serverId, clientId){
        const server = client.guilds.get(serverId);
        let defer = q.defer();
        if(server){
            const channel = server.channels.get(clientId);
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
        return client.voiceConnections.has(id);
    }

    function getConnection(id){
        return client.voiceConnections.get(id);
    }

    //serverID == key for voiceConnections
    function disconnectVoice(id){
        let connection = client.voiceConnections.get(id);
        if(connection){
            connection.disconnect();
        }
    }
}