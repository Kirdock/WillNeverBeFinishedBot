'use strict'

const q = require('q');

module.exports = (client) =>{
    let voiceHelper = {
        joinVoiceChannel: joinVoiceChannel,
        disconnectVoice: disconnectVoice,
        hasConnection: hasConnection,
        getConnection: getConnection
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

    function hasConnection(id){
        return client.voiceConnections.has(id);
    }

    function getConnection(id){
        return client.voiceConnections.get(id);
    }

    //serverID == key for voiceConnections
    function disconnectVoice(id){
        client.voiceConnections.get(id).disconnect();
    }
}