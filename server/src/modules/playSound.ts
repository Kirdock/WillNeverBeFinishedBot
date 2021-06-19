import { Message, Snowflake, StreamDispatcher, VoiceConnection, VoiceState } from 'discord.js';
import ytdl from 'ytdl-core';
import { Command } from './Command';
import { ErrorTypes } from '../services/ErrorTypes';

export class PlayCommand extends Command {
    protected commandText = 'play';
    public static forcePlayLock: Snowflake[] = [];
    private readonly fileNotFoundMessage = 'De Datei gibts nit du Volltrottl!';

    async doWork(message: Message): Promise<void> {
        if (!message.guild) {
            return;
        }

        const content = this.getContentWithoutCommand(message);
        const meta = await this.databaseHelper.getSoundMetaByName(content);
        const path = meta?.path;
        if (!path) {
            message.reply(this.fileNotFoundMessage);
            return;
        }
        if (this.voiceHelper.hasConnection(message.guild.id)) {
            this.playSound(path, message.guild.id);
        }
        else {
            try {
                await this.voiceHelper.joinVoiceChannel(message);
                this.playSound(message.guild.id, message.channel.id, path);
            }
            catch (e) {
                this.logger.error(e, { message: message.content });
            }
        }
    }

    async requestSound(path: string, serverId: string, channelId: string, volumeMultiplier: number, forcePlay: boolean): Promise<void> {
        if (this.fileHelper.existsFile(path)) {
            this.playSound(serverId, channelId, path, volumeMultiplier, undefined, forcePlay);
        }
        else {
            throw ErrorTypes.FILE_NOT_FOUND;
        }
    }

    async playSound(serverId: Snowflake, channelId: string, file?: string, volumeMultiplier = 0.5, url?: string, forcePlay?: boolean): Promise<void> {

        if (PlayCommand.forcePlayLock.includes(serverId) && !forcePlay) {
            return;
        }
        if (forcePlay) {
            PlayCommand.forcePlayLock.push(serverId);
        }
        const connection: VoiceConnection = this.voiceHelper.getConnection(serverId) ?? await this.voiceHelper.joinVoiceChannelById(serverId, channelId);
        let dispatcher: StreamDispatcher = connection.dispatcher;
        const serverInfo = await this.databaseHelper.getServerSettings(serverId);
        if (dispatcher) { //if bot is playing something at the moment, it interrupts and plays the other file
            dispatcher.destroy(new Error('playFile')); //Parameter = reason why dispatcher ended
        }

        if (!file && url) {
            const streamOptions = { seek: 0, volume: volumeMultiplier };
            const stream = ytdl(url, { filter: 'audioonly' });
            dispatcher = connection.play(stream, streamOptions);
        }
        else if (file) {
            dispatcher = connection.play(file);
        }

        dispatcher.on('finish', (streamTime: string) => {
            if(forcePlay) {
                this.removeLock(serverId);
            }
            if (serverInfo.leaveChannelAfterPlay && (streamTime === 'stream' || !streamTime)) {
                this.voiceHelper.disconnectVoice(serverId);
            }
        });

        dispatcher.on('error', (e: Error) => {
            if (e.message !== 'playFile') {
                this.logger.error(e, 'PlaySound');
                if(forcePlay) {
                    this.removeLock(serverId);
                }
            }
        });

        dispatcher.on('start', () => {
            dispatcher.setVolume(volumeMultiplier);
        });
    }

    private removeLock(serverId: string): void {
        const index = PlayCommand.forcePlayLock.indexOf(serverId);
        if (index !== -1) {
            PlayCommand.forcePlayLock.splice(index, 1);
        }
    }

    async playIntro(voiceState: VoiceState, fallBackIntro: string | undefined): Promise<void> {
        const newUserChannelId: Snowflake | undefined = voiceState.channel?.id;
        if (!newUserChannelId) return;

        const soundId = await this.databaseHelper.getIntro(voiceState.id, voiceState.guild.id) || fallBackIntro;
        if (soundId) {
            const soundMeta = await this.databaseHelper.getSoundMeta(soundId);
            if (soundMeta) {
                this.playSound(voiceState.guild.id, newUserChannelId, soundMeta.path);
            }
            //else remove intro if not found?
        }
    }

    async stopPlaying(serverId: Snowflake, isAdmin: boolean): Promise<void> {

        if (!PlayCommand.forcePlayLock.includes(serverId) || isAdmin) {
            const connection = this.voiceHelper.getConnection(serverId);
            if (connection) {
                const dispatcher = connection.dispatcher;
                if (dispatcher) {
                    dispatcher.end('stream');
                }
                else {
                    throw ErrorTypes.PLAY_DISPATCHER_NOT_FOUND;
                }
            }
            else {
                throw ErrorTypes.SERVER_ID_NOT_FOUND;
            }
        }
        else {
            throw ErrorTypes.PLAY_NOT_ALLOWED;
        }
    }

}