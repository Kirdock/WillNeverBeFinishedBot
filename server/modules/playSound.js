'use strict'
const fileHelper = require('../services/fileHelper.js')();
const playCommand = 'play';
const q = require('q');
const ytdl = require('ytdl-core');

module.exports = (config, logger, voiceHelper, databaseHelper) =>{

    let playSoundCommand = {
        doWork: doWork,
        isCommand: isCommand,
        requestSound: requestSound,
        stopPlaying: stopPlaying,
        doWorkWithoutMessage: doWorkWithoutMessage,
        requestYoutube: requestYoutube
    }
    const fileNotFoundMessage = 'De Datei gibts nit du Volltrottl!';

    return playSoundCommand;

    function isCommand(content){
        return content.startsWith(playCommand);
    }

    function doWork(message, content){
        const command = content.substring(playCommand.length).trim();
        const meta = databaseHelper.getSoundMetaByName(command);
        const path = meta ? meta.path : undefined;
        if(!path){
            message.reply(fileNotFoundMessage);
            return;
        }
        if(voiceHelper.hasConnection(message.guild.id)){
            playSound(path, message.guild.id);
        }
        else{
            voiceHelper.joinVoiceChannel(message)
            .then(connection =>{
                playSound(path, message.guild.id, connection);
            })
            .catch(error =>{
                if(error.message){
                    message.reply(error.message);
                }
                logger.error(error, 'JoinVoiceChannel');
            });
        }
    }

    function doWorkWithoutMessage(path, serverId, channelId){
        if(voiceHelper.hasConnection(serverId)){
            playSound(path, serverId);
        }
        else{
            voiceHelper.joinVoiceChannelById(serverId,channelId)
            .then(connection =>{
                playSound(path, serverId, connection);
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

    function requestYoutube(url, serverId, channelId, volumeMultiplier){
        return voiceHelper.joinVoiceChannelById(serverId,channelId).then(connection =>{
            playSound(undefined, serverId, connection, volumeMultiplier, url);
        })
    }

    function playSound(file, id, con, volumeMultiplier = 0.5, url, forcePlay){
        let forcePlayLock = databaseHelper.getForceLock();
        if(forcePlayLock && !forcePlay){
            return;
        }
        if(forcePlay){
            forcePlayLock = true;
            databaseHelper.setForceLock(true);
        }
        let delay = config.playSoundDelay;
        const connection = (con || voiceHelper.getConnection(id));
        let dispatcher = connection.dispatcher;
        const serverInfo = databaseHelper.getServerInfo(id);
        if(dispatcher){ //if bot is playing something at the moment, it interrupts and plays the other file
            dispatcher.destroy('playFile'); //Parameter = reason why dispatcher ended
            delay = 0;
        }

        setTimeout(()=>{
            if(!file){
                const streamOptions = { seek: 0, volume: volumeMultiplier };
                const stream = ytdl(url, { filter : 'audioonly' });
                dispatcher = connection.play(stream, streamOptions);
            }
            else{
                dispatcher = connection.play(file);
            }

            dispatcher.on('finish', (reason) => {
                if(forcePlayLock){
                    databaseHelper.setForceLock(false);
                }
                if(serverInfo.leaveChannelAfterPlay && (reason === 'stream' || !reason)){ //atm reason is empty when file is finished
                    voiceHelper.disconnectVoice(id);
                }
            });
            
            dispatcher.on('error', e => {
                if(e !== 'playFile'){
                    logger.error(e || 'empty', 'PlaySound');
                }
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

    function stopPlaying(serverId, isAdmin){
        const forcePlayLock = databaseHelper.getForceLock();
        if(forcePlayLock && !isAdmin){
            return;
        }
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