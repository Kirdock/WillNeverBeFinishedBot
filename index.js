'use strict'

const Discord = require('discord.js');
const config = require('./config.json');
const logger = require( './services/logger.js')(config, __dirname );
const client = new Discord.Client();
const prefixes = ['-','!'];
const listCommand = require('./modules/list.js')(config, logger);
const questionCommand = require('./modules/question.js')(config, logger);
const voiceHelper = require('./services/voiceHelper.js')(client, config, logger);
const playSoundCommand = require('./modules/playSound.js')(config, logger, voiceHelper);
// client.on('debug', console.log);

require('./server/server.js')(client, config, logger);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
    let content = undefined;
    let prefixFound = false;
    for(let i = 0; i < prefixes.length; i++){
        if(message.content.startsWith(prefixes[i]))
        {
            content = message.content.substring(prefixes[i].length);
            prefixFound = true;
            break;
        }
    }
    
    if(!prefixFound && message.content.startsWith('<@'+config.botId+'>')){
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
            voiceHelper.disconnectVoice(message.guild.id);
        }
        else if(content === 'join'){
            voiceHelper.joinVoiceChannel(message);
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
