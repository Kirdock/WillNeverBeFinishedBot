import type { Snowflake, VoiceState } from 'discord.js';
import type { AudioPlayer, AudioPlayerError, AudioResource, VoiceConnection } from '@discordjs/voice';
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, StreamType } from '@discordjs/voice';
import { voiceHelper } from './voiceHelper';
import { databaseHelper } from './databaseHelper';
import ytdl from '@distube/ytdl-core';
import { createReadStream } from 'fs';
import type { IServerSettings } from '../../../shared/interfaces/server-settings';
import { fileHelper } from './fileHelper';
import { ErrorTypes } from './ErrorTypes';
import { scopedLogger } from './logHelper';

const forcePlayLock: { [key: string]: boolean | undefined } = {};
const audioPlayers: { [serverId: string]: AudioPlayer | undefined } = {};

const logger = scopedLogger('PLAY_SOUND');

export async function playSound(serverId: Snowflake, channelId: string, file?: string, volumeMultiplier = 1, url?: string, forcePlay?: boolean): Promise<void> {
    if (!forcePlay && forcePlayLock[serverId]) {
        return;
    }
    if (forcePlay) {
        forcePlayLock[serverId] = true;
    }
    const connection: VoiceConnection = await voiceHelper.getOrJoinVoiceChannel(serverId, channelId);
    const serverInfo = await databaseHelper.getServerSettings(serverId);
    const player = getAudioPlayer(serverId, serverInfo);

    connection.subscribe(player);

    let resource: AudioResource | undefined;
    const streamOptions = { inlineVolume: true, inputType: StreamType.OggOpus };
    if (!file && url) {
        resource = createAudioResource(ytdl(url, { filter: 'audioonly' }), { ...streamOptions, inputType: StreamType.WebmOpus });
    } else if (file) {
        resource = createAudioResource(createReadStream(file), streamOptions);
    }
    if (resource) {
        resource.volume?.setVolume(volumeMultiplier);
        logger.debug(`${file ?? url} starts playing. Player State: ${player.state.status}`, 'playSound');
        player.play(resource);
    }
}

function getAudioPlayer(serverId: Snowflake, serverInfo?: IServerSettings): AudioPlayer {
    const serverPlayer = audioPlayers[serverId];
    if (serverPlayer) {
        return serverPlayer;
    }
    const player = createAudioPlayer();
    player.on(AudioPlayerStatus.Idle, () => {
        removeLock(serverId);
        if (serverInfo?.leaveChannelAfterPlay) {
            voiceHelper.disconnectVoice(serverId);
        }
    });
    player.on('error', (error: AudioPlayerError) => {
        logger.error(error);
        removeLock(serverId);
    });
    audioPlayers[serverId] = player;
    return player;
}

function removeLock(serverId: string): void {
    delete forcePlayLock[serverId];
}

export function hasPlayLock(guildId: string): boolean {
    return !!forcePlayLock[guildId];
}

export async function playIntro(voiceState: VoiceState, fallBackIntro: string | undefined): Promise<void> {
    const newUserChannelId: Snowflake | undefined = voiceState.channel?.id;
    if (!newUserChannelId) {
        return;
    }

    const soundId = await databaseHelper.getIntro(voiceState.id, voiceState.guild.id) || fallBackIntro;
    if (!soundId) {
        //remove intro if not found?
        return;
    }
    const soundMeta = await databaseHelper.getSoundMeta(soundId);
    if (soundMeta) {
        await playSound(voiceState.guild.id, newUserChannelId, soundMeta.path);
    }
}

export async function requestSound(path: string, serverId: string, channelId: string, volumeMultiplier: number, forcePlay: boolean): Promise<void> {
    if (fileHelper.existsFile(path)) {
        await playSound(serverId, channelId, path, volumeMultiplier, undefined, forcePlay);
    } else {
        throw new Error(ErrorTypes.FILE_NOT_FOUND);
    }
}

export async function stopPlaying(serverId: Snowflake, isAdmin: boolean): Promise<void> {
    if (!forcePlayLock[serverId] || isAdmin) {
        const connection = voiceHelper.getActiveConnection(serverId);
        if (connection) {
            const player = getAudioPlayer(serverId);
            player.stop(true);
        } else {
            throw new Error(ErrorTypes.SERVER_ID_NOT_FOUND);
        }
    } else {
        throw new Error(ErrorTypes.PLAY_NOT_ALLOWED);
    }
}
