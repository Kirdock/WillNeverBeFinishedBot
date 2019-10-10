'use strict'

const Discord = require('discord.js');
const config = require('../config/config.json');
const logger = require( '../services/logger.js')(config, __dirname );
const client = new Discord.Client();
const prefixes = ['-','!'];
const listCommand = require('../modules/list.js')(config, logger);
const questionCommand = require('../modules/question.js')(config, logger);
const voiceHelper = require('../services/voiceHelper.js')(client, config, logger);
const playSoundCommand = require('../modules/playSound.js')(config, logger, voiceHelper);
// client.on('debug', console.log);

require('../webserver/server.js')(client, config, logger);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
    let newUserChannel = newMember.voiceChannel
    let oldUserChannel = oldMember.voiceChannel

    if(newMember.id == config.clientId){
        return;
    }

    if(oldUserChannel === undefined && newUserChannel !== undefined) {
        let sound = 'servus';
        if(newMember.id == '174203817351446529'){ //Timmy
            sound = 'timmy'
        }
        else if(newMember.id == '161084180560609280'){ //Thaler
            sound = 'qq';
        }
        else if(newMember.id == '300642449049780224' || newMember.id == '103645166740463616'){ //Trupp, Kapfe
            sound = 'pickn';
        }
        playSoundCommand.doWorkWithoutMessage(sound,newMember.guild.id,newMember.voiceChannel.id);
    } else if(newUserChannel === undefined){

        // User leaves a voice channel
    }
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
    
    if(!prefixFound && message.content.startsWith('<@'+config.clientId+'>')){
        content = message.content.substring(config.clientId.length+3);
    }
    if(content){
        content = content.toLocaleLowerCase().trim();
        if(listCommand.isCommand(content)){
            //listCommand.doWork(message);
            message.reply('http://kirdock.synology.me:4599/');
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
    else if(message.content === 'sieg'){
        message.reply('Heil!');
    }
});

client.login(config.token);
