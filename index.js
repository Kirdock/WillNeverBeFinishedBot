'use strict'

const Discord = require('discord.js');
const logger = require( './services/logger.js')( __dirname );
const config = require('./config.json')
const client = new Discord.Client();
const prefix = '-';
const listCommand = require('./modules/list.js')(config, logger);
const questionCommand = require('./modules/question.js')(config, logger);
const playSoundCommand = require('./modules/playSound.js')(client, config, logger);

require('./server/server.js')(client, config, logger);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
    let content = undefined;
    if(message.content.startsWith(prefix))
    {
        content = message.content.substring(prefix.length);
    }
    else if(message.content.startsWith('<@'+config.botId+'>')){
        content = message.content.substring(config.botId.length+3);
    }
    if(content){
        content = content.toLocaleLowerCase().trim();
        if(listCommand.isCommand(content)){
            listCommand.doWork(message);
        }
        else if(questionCommand.isCommand(content))
        {
            questionCommand.doWork(content, message);
        }
        else if(playSoundCommand.isCommand(content))
        {
            playSoundCommand.doWork(message, content);
        }
        else if(content === 'ping'){
            message.reply('pong');
        }
        else if(content === 'stop'){
            disconnectVoice();
        }
        else if(content === 'join'){
            joinVoiceChannel(message);
        }
        else if(content === 'flip'){
            message.reply(Math.floor(Math.random()*2) == 0 ? 'Kopf' : 'Zahl');
        }
        else{
            message.reply('Red Deitsch mit mir! I hob kan Plan wos du von mir wüllst!');
        }
    }
});

client.login(config.token);