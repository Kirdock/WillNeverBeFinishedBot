'use strict'

const fs = require('fs');
const fileHelper = require('../services/fileHelper.js')(); 
const commandAlias = ['command', 'commands', 'list', 'help', '?'];

module.exports = (config, logger) =>{
    let listCommand = {
        doWork: doWork,
        isCommand: isCommand
    }

    return listCommand;

    function isCommand(content){
        return commandAlias.indexOf(content) > -1;
    }

    function doWork(message){
        const dirs = fileHelper.getDirectoriesOfSoundFolder();
        let fileNames = [];
        dirs.forEach(dir => fileNames = fileNames.concat(fs.readdirSync(dir)));
        
        message.reply(
            '\n__***Befehle:***__'
            +'```'
            +'- Irgendeine Frage?\n'
            +'- flip\n'
            +'- play [Dateiname]\n'
            +'- stop'
            +'```'
            +'__***Verfügbare Sounds:***__\n'
        );
        let start = 0;
        for(let i = 40; i < fileNames.length; i+=20){
            message.reply('```--'+fileNames.slice(start,i).join('\n- ')+'```');
            start = i;
        }
    }

}