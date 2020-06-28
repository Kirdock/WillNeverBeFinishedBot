'use strict'

const Discord = require('discord.js');
const config =  require('../config/config.json');
const logger = require( '../services/logger.js')(config, __dirname );
const client = new Discord.Client();
const prefixes = ['-','!'];
const databaseHelper = require('../services/databaseHelper.js')();
const listCommand = require('../modules/list.js')(config, logger);
const questionCommand = require('../modules/question.js')(config, logger);
const voiceHelper = require('../services/voiceHelper.js')(client, config, logger);
const playSoundCommand = require('../modules/playSound.js')(config, logger, voiceHelper, databaseHelper);
const clientHelper = require('../services/clientHelper.js')(client, logger);
// client.on('debug', console.log);

require('../webserver/server.js')(client, config, logger, databaseHelper);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    const serverInfo = databaseHelper.getServerInfo(newState.guild.id);

    if(!serverInfo || newState && newState.id == config.clientId){
        return;
    }
    
    const newUserChannel = newState.channel && newState.channel.id;
    const oldUserChannel = oldState.channel && oldState.channel.id;
    const oldChannelMembers = oldUserChannel && oldState.guild.channels.cache.get(oldUserChannel).members;
    const oldChannelMemberCount = oldChannelMembers && oldChannelMembers.size;

    if(oldUserChannel && newUserChannel != oldUserChannel && oldChannelMemberCount === 1 && oldChannelMembers.get(config.clientId)){ //leave/switch to another channel
        voiceHelper.disconnectVoice(oldState.guild.id);
        return;
    }
    if((!oldUserChannel || serverInfo.playIntroWhenUnmuted && oldState.selfDeaf && !newState.selfDeaf) && newUserChannel && serverInfo.intro && (!serverInfo.minUser || newState.guild.channels.cache.get(newUserChannel).members.size > 1)) {
        const soundId = databaseHelper.getIntro(newState.id, newState.guild.id) || serverInfo.defaultIntro;
        if(soundId){
            const soundMeta = databaseHelper.getSoundMeta(soundId);
            if(soundMeta){
                playSoundCommand.doWorkWithoutMessage(soundMeta.path,newState.guild.id,newUserChannel);
            }
            //else remove intro if not found?
        }
    }
    else if(!newUserChannel && oldUserChannel && serverInfo.outro && oldChannelMemberCount > 0){
        // User leaves a voice channel
        const soundId = serverInfo.defaultOutro;
        if(soundId){
            const soundMeta = databaseHelper.getSoundMeta(soundId);
            if(soundMeta){
                playSoundCommand.doWorkWithoutMessage(soundMeta.path,oldState.guild.id,oldUserChannel);
            }
            //else remove intro if not found?
        }
    }
  });

client.on('message', message => {
    let content = undefined;
    let prefixFound = false;
    const messageContent = message.content.toLocaleLowerCase().trim();
    for(let i = 0; i < prefixes.length; i++){
        if(messageContent.startsWith(prefixes[i]))
        {
            content = message.content.substring(prefixes[i].length);
            prefixFound = true;
            break;
        }
    }
    
    if(!prefixFound && messageContent.startsWith('<@'+config.clientId+'>')){
        content = message.content.substring(config.clientId.length+3);
    }
    if(content){

        content = content.trim();
        if(playSoundCommand.isCommand(content))
        {
            playSoundCommand.doWork(message, content);
        }
        else{
            content = content.toLocaleLowerCase();
            if(listCommand.isCommand(content)){
                message.reply('https://kirdock.synology.me:4599/');
            }
            else if(questionCommand.isCommand(content))
            {
                questionCommand.doWork(content, message);
            }
            else if(content === 'ping'){
                message.reply('pong');
            }
            else if(content === 'leave'){
                voiceHelper.disconnectVoice(message.guild.id);
            }
            else if(content === 'stop'){
                clientHelper.isUserAdminInServer(result.user.id,req.body.serverInfo.id).then(()=>{
                    playSoundCommand.stopPlaying(message.guild.id, true);
                }).catch(()=>{
                    playSoundCommand.stopPlaying(message.guild.id);
                })
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
    }
    else if(messageContent === 'sieg'){
        message.reply('Heil!');
    }
    else if(messageContent === 'heil'){
        message.reply('Hitler!');
    }
});

client.login(config.token);
