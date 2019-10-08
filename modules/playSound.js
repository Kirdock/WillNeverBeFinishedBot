'use strict'
const fileHelper = require('./../services/fileHelper.js')();
const playCommand = 'play';
const q = require('q');

module.exports = (config, logger, voiceHelper) =>{
    let playSoundCommand = {
        doWork: doWork,
        isCommand: isCommand,
        requestSound: requestSound,
        stopPlaying: stopPlaying
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
                logger.error(error, 'JoinVoiceChannel');
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


    function playSound(file, id, con, volumeMultiplier = 0.5){
        let delay = config.playSoundDelay;
        const connection = (con || voiceHelper.getConnection(id));
        
        let dispatcher = connection.dispatcher;
        if(dispatcher){ //if bot is playing something at the moment, it interrupts and plays the other file
            dispatcher.end('playFile'); //Parameter = reason why dispatcher ended
            delay = 0;
        }

        setTimeout(()=>{

            dispatcher = connection.playFile(file);
            dispatcher.on('end', (reason) => {
                if(reason === 'stream'){
                    voiceHelper.disconnectVoice(id);
                }
                else if(reason !== 'playFile'){
                    logger.error(reason || 'empty', 'PlaySound');
                }
            });
            
            dispatcher.on('error', e => {
            // Catch any errors that may arise
                logger.error(e, 'playSound');
            });

            // dispatcher.on('debug', e => {
            // // Catch any errors that may arise
            // });
    
            dispatcher.on('start', () => {
                dispatcher.setVolume(volumeMultiplier);
            });
            
            //   console.log(dispatcher.time); // The time in milliseconds that the stream dispatcher has been playing for
            
            //   dispatcher.pause(); // Pause the stream
            //   dispatcher.resume(); // Carry on playing
            
            //   dispatcher.end(); // End the dispatcher, emits 'end' event
        },delay);
    }

    function stopPlaying(serverId){
        var defer = q.defer();
        const message = 'Does not play anything on this server';
        const connection = voiceHelper.getConnection(serverId);
        if(connection){
            const dispatcher = connection.dispatcher;
            if(dispatcher){
                dispatcher.end('stream');
                defer.resolve('stopped');
            }
            else{
                defer.reject(message);
            }
        }
        else{
            defer.reject(message);
        }
        return defer.promise;
    }
}