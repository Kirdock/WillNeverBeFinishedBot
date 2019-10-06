'use strict'
const fileHelper = require('./../services/fileHelper.js')();
const playCommand = 'play';
const q = require('q');

module.exports = (config, logger, voiceHelper) =>{
    let playSoundCommand = {
        doWork: doWork,
        isCommand: isCommand,
        requestSound: requestSound
    }
    const fileNotFoundMessage = 'De Datei gibts nit du Volltrottl!';

    return playSoundCommand;

    function isCommand(content){
        return content.startsWith(playCommand);
    }

    function doWork(message, content){
        const command = content.substring(playCommand.length).trim();
        const foundFile = fileHelper.tryGetSoundFile(command);
        if(!foundFile){
            message.reply(fileNotFoundMessage);
        }
        if(voiceHelper.hasConnection(message.guild.id)){
            playSound(foundFile, message.guild.id);
        }
        else{
            voiceHelper.joinVoiceChannel(message)
            .then(connection =>{
                playSound(foundFile, message.guild.id, connection);
            })
            .catch(error =>{
                if(error.message){
                    message.reply(error.message);
                }
                logger.error(error);
            });
        }
    }

    function requestSound(path, serverId, channelId, volumeMultiplier){
        if(fileHelper.existsFile(path)){
            return voiceHelper.joinVoiceChannelById(serverId, channelId).then(connection =>{
                playSound(path,serverId,connection, volumeMultiplier);
            });
        }
        else{
            return q.reject(fileNotFoundMessage);
        }
    }


    function playSound(file, id, connection, volumeMultiplier = 0.5){
        setTimeout(()=>{
            const dispatcher = (connection || voiceHelper.getConnection(id)).playFile(file);
            dispatcher.on('end', () => {
                voiceHelper.disconnectVoice(id);
            });
            
            dispatcher.on('error', e => {
            // Catch any errors that may arise
                logger.error(e);
            });
    
            dispatcher.on('start', () => {
                dispatcher.setVolume(volumeMultiplier);
            });
            
            //   console.log(dispatcher.time); // The time in milliseconds that the stream dispatcher has been playing for
            
            //   dispatcher.pause(); // Pause the stream
            //   dispatcher.resume(); // Carry on playing
            
            //   dispatcher.end(); // End the dispatcher, emits 'end' event
        },config.playSoundDelay);
    }
}