'use strict'
const path = require('path');
const fileHelper = require('./../services/fileHelper.js')
const playCommand = 'play';

module.exports = (config, logger, voiceHelper) =>{
    let playSoundCommand = {
        doWork: doWork,
        isCommand: isCommand
    }

    return playSoundCommand;

    function isCommand(content){
        return content.startsWith(playCommand);
    }

    function doWork(message, content){
        const command = content.substring(playCommand.length).trim();
        const dirs = fileHelper.getDirectories(config.soundFolder);
        let foundFile = undefined;
        for(let i = 0; i < dirs.length; i++){
            let file = path.join(dirs[i],command+'.mp3');
            if(fs.existsSync(file))
            {
                foundFile = file;
                break;
            }
        }
        if(!foundFile){
            return;
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