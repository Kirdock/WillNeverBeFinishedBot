const Discord = require('discord.js');
const q = require('q');
const fs = require('fs');
const client = new Discord.Client();
const prefix = '-';
const soundFolder = 'C:/Users/Klaus/Downloads/DiscordSounds';
const playCommand = 'play';
let voiceConnection = undefined;
const path = require('path');
const playSoundDelay = 1000;
const answers = ['Jo','Na','Frag doch einfach nochmal'];
const commandAlias = ['command', 'commands', 'list', 'help', '?'];
const botID = '630064403525533706';

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
    let content = undefined;
    if(message.content.startsWith(prefix))
    {
        content = message.content.substring(prefix.length).toLocaleLowerCase().trim();
    }
    else if(message.content.startsWith('<@'+botID+'>')){
        content = message.content.substring(botID.length+3).trim();
    }
    // else if(message.isMentioned(botID)){
    //     console.log(message.content);
    // }
    if(content){
        if(commandAlias.indexOf(content) > -1){
            const fileNames = fs.readdirSync(soundFolder);
            message.reply(
                '\n__***Befehle:***__'
                +'```'
                +'- Irgendeine Frage?\n'
                +'- flip\n'
                +'- play [Dateiname]\n'
                +'```'
                +'__***Verfügbare Sounds:***__\n'
                + '```'
                + '- ' + fileNames.join('\n- ')
                +'```'
            );
        }
        else if(content.endsWith('?'))
        {
            let reply = 'Na';
            if(content.indexOf('klaus') == -1){
                reply = answers[Math.floor(Math.random()*answers.length)];
            }
            message.reply(reply);
        }
        else if(content.startsWith(playCommand))
        {
            const command = content.substring(playCommand.length).trim();
            const file = path.join(soundFolder,command+'.mp3');
            if(!fs.existsSync(file))
            {
                message.reply('De Datei gibts nit du Volltrottl!');
                return;
            }
            if(voiceConnection){
                playSound(file);
            }
            else{
                joinVoiceChannel(message)
                .then(connection =>{
                    voiceConnection = connection;
                    message.reply('Bin gejoint!');
                    playSound(file);
                })
                .catch(error =>{
                    if(error.message){
                        message.reply(error.message);
                    }
                    console.log(error);
                });
            }
        }
        else if(content === 'flip'){
            message.reply(Math.floor(Math.random()*2) == 0 ? 'Kopf' : 'Zahl');
        }
        else{
            message.reply('Red Deitsch mit mir! I hob kan Plan wos du von mir wüllst!');
        }
    }
});


function joinVoiceChannel(message){
    if (message.member.voiceChannel) {
        return message.member.voiceChannel.join();
    }
    else
    {
        return q.reject({message:'I konn nit joinen du Volltogga!'});
    }
}

function playSound(file){
    setTimeout(()=>{
        const dispatcher = voiceConnection.playFile(file);
        dispatcher.on('end', () => {
            voiceConnection.disconnect();
            voiceConnection = undefined;
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
    },playSoundDelay);
}

client.login('NjMwMDY0NDAzNTI1NTMzNzA2.XZi3jQ.KY1Bs-WCWVZgx5JjVnNeUE5JaGw');
