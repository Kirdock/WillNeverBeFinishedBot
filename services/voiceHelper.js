'use strict'

const q = require('q');

module.exports = () =>{
    let voiceHelper = {
        joinVoiceChannel: joinVoiceChannel,
        disconnectVoice: disconnectVoice
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

    //serverID == key for voiceConnections
    function disconnectVoice(client, id){
        client.voiceConnections.get(id).disconnect();
    }
}