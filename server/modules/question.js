'use strict'
const answers = ['Na','Jo','Frag doch einfach nochmal'];

module.exports = (config, logger) =>{
    let question = {
        isCommand: isCommand,
        doWork: doWork
    }

    return question;

    function isCommand(content){
        return content.endsWith('?');
    }

    function doWork(content, message){
        let reply = answers[0];
        if(content.indexOf('klaus') == -1){
            reply = answers[Math.floor(Math.random()*answers.length)];
        }
        message.reply(reply);
    }
}