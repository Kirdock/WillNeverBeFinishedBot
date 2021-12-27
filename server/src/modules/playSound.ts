import { Message, Snowflake, VoiceState } from 'discord.js';
import ytdl from 'ytdl-core';
import { Command } from './Command';
import { ErrorTypes } from '../services/ErrorTypes';
import { AudioPlayer, AudioPlayerError, AudioPlayerState, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, StreamType, VoiceConnection } from '@discordjs/voice';
import { ServerSettings } from '../models/ServerSettings';

export class PlayCommand extends Command {
    protected commandText = 'play';
    public static forcePlayLock: { [key: string]: boolean } = {};
    private readonly fileNotFoundMessage = 'De Datei gibts nit du Volltrottl!';
    private readonly userNotInVoiceChannelMessage = 'Du bist in kan Voice Channel!!';
    private readonly audioPlayers: { [serverId: string]: AudioPlayer } = {};

    public async doWork(message: Message): Promise<void> {
        if (!message.guild) {
            return;
        }

        const content = this.getContentWithoutCommand(message);
        const meta = await this.databaseHelper.getSoundMetaByName(content);
        const path = meta?.path;
        if (!path) {
            await message.reply(this.fileNotFoundMessage);
            return;
        } else if (!message.member?.voice.channelId) {
            await message.reply(this.userNotInVoiceChannelMessage);
            return;
        } else {
            try {
                await this.playSound(message.guild.id, message.member?.voice.channelId, path);
            } catch (e) {
                this.logger.error(e, {message: message.content});
            }
        }
    }

    public async requestSound(path: string, serverId: string, channelId: string, volumeMultiplier: number, forcePlay: boolean): Promise<void> {
        if (this.fileHelper.existsFile(path)) {
            await this.playSound(serverId, channelId, path, volumeMultiplier, undefined, forcePlay);
        } else {
            throw ErrorTypes.FILE_NOT_FOUND;
        }
    }

    public async playSound(serverId: Snowflake, channelId: string, file?: string, volumeMultiplier = 0.5, url?: string, forcePlay?: boolean): Promise<void> {
        if (!forcePlay && PlayCommand.forcePlayLock[serverId]) {
            return;
        }
        if (forcePlay) {
            PlayCommand.forcePlayLock[serverId] = true;
        }
        const connection: VoiceConnection = await this.voiceHelper.getOrJoinVoiceChannel(serverId, channelId);
        const serverInfo = await this.databaseHelper.getServerSettings(serverId);
        const player = this.getAudioPlayer(serverId, serverInfo);

        connection.subscribe(player);

        let resource: AudioResource | undefined;
        const streamOptions = {inlineVolume: true, inputType: StreamType.OggOpus};
        if (!file && url) {
            const stream = ytdl(url, {filter: 'audioonly'});
            resource = createAudioResource(stream, streamOptions);
        } else if (file) {
            resource = createAudioResource(file, streamOptions);
        }
        if (resource) {
            resource.volume?.setVolume(volumeMultiplier);
            player.play(resource);
        }
    }

    private getAudioPlayer(serverId: Snowflake, serverInfo?: ServerSettings): AudioPlayer {
        if (!this.audioPlayers[serverId]) {
            const player = createAudioPlayer();
            player.on(AudioPlayerStatus.Idle, (listener: AudioPlayerState) => {
                this.removeLock(serverId);
                if (serverInfo?.leaveChannelAfterPlay) {
                    this.voiceHelper.disconnectVoice(serverId);
                }
            });
            player.on('error', (error: AudioPlayerError) => {
                this.logger.error(error, 'PlaySound');
                this.removeLock(serverId);
            });
            this.audioPlayers[serverId] = player;
        }
        return this.audioPlayers[serverId];
    }

    private removeLock(serverId: string): void {
        delete PlayCommand.forcePlayLock[serverId];
    }

    public async playIntro(voiceState: VoiceState, fallBackIntro: string | undefined): Promise<void> {
        const newUserChannelId: Snowflake | undefined = voiceState.channel?.id;
        if (!newUserChannelId) return;

        const soundId = await this.databaseHelper.getIntro(voiceState.id, voiceState.guild.id) || fallBackIntro;
        if (soundId) {
            const soundMeta = await this.databaseHelper.getSoundMeta(soundId);
            if (soundMeta) {
                await this.playSound(voiceState.guild.id, newUserChannelId, soundMeta.path);
            }
            //else remove intro if not found?
        }
    }

    public async stopPlaying(serverId: Snowflake, isAdmin: boolean): Promise<void> {
        if (!PlayCommand.forcePlayLock[serverId] || isAdmin) {
            const connection = this.voiceHelper.getActiveConnection(serverId);
            if (connection) {
                const player = this.getAudioPlayer(serverId);
                player.stop(true);
            } else {
                throw ErrorTypes.SERVER_ID_NOT_FOUND;
            }
        } else {
            throw ErrorTypes.PLAY_NOT_ALLOWED;
        }
    }

}