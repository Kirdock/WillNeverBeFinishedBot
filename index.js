const Discord = require('discord.js');
const client = new Discord.Client();
const prefix = '-';
const soundFolder = 'C:/Users/Klaus/Downloads/DiscordSounds';
const playCommand = 'play';
let voiceConnection = undefined;
const path = require('path');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
    
    if(message.content.startsWith(prefix))
    {
        let content = message.content.substring(1).toLocaleLowerCase().trim();
        if(content.indexOf('klaus') > -1)
        {
            message.reply('Na');
        }
        else if(content.endsWith('.') || content.endsWith('?'))
        {
            message.reply('Jo');
        }
        else if(content.startsWith(playCommand))
        {
            joinVoiceChannel(message, content.substring(playCommand.length).trim());
        }
    }
});


function joinVoiceChannel(message, content)
{
    if (message.member.voiceChannel) {
        if(!voiceConnection)
        {
            message.member.voiceChannel.join()
            .then(connection => { // Connection is an instance of VoiceConnection
                voiceConnection = connection;
                message.reply('Bin gejoint!');
                playSound(content);
            })
            .catch(console.log);
        }
        else
        {
            playSound(content);
        }
    }
    else
    {
        message.reply('I konn nit joinen du Volltogga!');
    }
}

function playSound( file){
    const dispatcher = voiceConnection.playFile(path.join(soundFolder,file+'.mp3'));
    dispatcher.on('end', () => {
        voiceConnection.disconnect();
        voiceConnection = undefined;
      });
      
    dispatcher.on('error', e => {
    // Catch any errors that may arise
        console.log(e);
    });
      
    //   dispatcher.setVolume(0.5); // Set the volume to 50%
    //   dispatcher.setVolume(1); // Set the volume back to 100%
      
    //   console.log(dispatcher.time); // The time in milliseconds that the stream dispatcher has been playing for
      
    //   dispatcher.pause(); // Pause the stream
    //   dispatcher.resume(); // Carry on playing
      
    //   dispatcher.end(); // End the dispatcher, emits 'end' event
}

client.login('NjMwMDY0NDAzNTI1NTMzNzA2.XZi3jQ.KY1Bs-WCWVZgx5JjVnNeUE5JaGw');