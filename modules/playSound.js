'use strict'
const fileHelper = require('./../services/fileHelper.js')();
const playCommand = 'play';

module.exports = (config, logger, voiceHelper) =>{
    let playSoundCommand = {
        doWork: doWork,
        isCommand: isCommand,
        requestSound: requestSound
    }

    return playSoundCommand;

    function isCommand(content){
        return content.startsWith(playCommand);
    }

    function doWork(message, content){
        const command = content.substring(playCommand.length).trim();
        const foundFile = fileHelper.tryGetSoundFile(command);
        if(!foundFile){
            message.reply('De Datei gibts nit du Volltrottl!');
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

    function requestSound(path, serverId, channelId){
        return voiceHelper.joinVoiceChannelById(serverId, channelId).then(connection =>{
            playSound(path,undefined,connection);
        });
    }


    function playSound(file, id, connection){
        setTimeout(()=>{
            const dispatcher = (connection || voiceHelper.getConnection(id)).playFile(file);
            dispatcher.on('end', () => {
                voiceHelper.disconnectVoice(id);
            });
            
            dispatcher.on('error', e => {
            // Catch any errors that may arise
                console.log(e);
            });
    
            dispatcher.on('start', () => {
                dispatcher.setVolume(0.50);
            });
            
            //   console.log(dispatcher.time); // The time in milliseconds that the stream dispatcher has been playing for
            
            //   dispatcher.pause(); // Pause the stream
            //   dispatcher.resume(); // Carry on playing
            
            //   dispatcher.end(); // End the dispatcher, emits 'end' event
        },config.playSoundDelay);
    }
}