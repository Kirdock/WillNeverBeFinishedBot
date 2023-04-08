import type { Snowflake, VoiceState } from 'discord.js';
import type {
    AudioPlayer,
    AudioPlayerError,
    AudioResource,
    VoiceConnection
} from '@discordjs/voice';
import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    StreamType
} from '@discordjs/voice';
import { voiceHelper } from './voiceHelper';
import { databaseHelper } from './databaseHelper';
import { stream as youtubeStream } from 'play-dl';
import { createReadStream } from 'fs';
import type { IServerSettings } from '../../../shared/interfaces/server-settings';
import { fileHelper } from './fileHelper';
import { InteractionError } from '../utils/InteractionError';
import { ErrorTypes } from './ErrorTypes';
import { scopedLogger } from './logHelper';

const forcePlayLock: { [key: string]: boolean | undefined } = {};
const audioPlayers: { [serverId: string]: AudioPlayer | undefined } = {};

const logger = scopedLogger('PLAY_SOUND');

export async function playSound(serverId: Snowflake, channelId: string, file?: string, volumeMultiplier = 0.5, url?: string, forcePlay?: boolean): Promise<void> {
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
        const stream = await youtubeStream(url);
        resource = createAudioResource(stream.stream, { ...streamOptions, inputType: stream.type });
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
        logger.error(error, 'PlaySound');
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
    if (soundId) {
        const soundMeta = await databaseHelper.getSoundMeta(soundId);
        if (soundMeta) {
            await playSound(voiceState.guild.id, newUserChannelId, soundMeta.path);
        }
        //else remove intro if not found?
    }
}

export async function requestSound(path: string, serverId: string, channelId: string, volumeMultiplier: number, forcePlay: boolean): Promise<void> {
    if (fileHelper.existsFile(path)) {
        await playSound(serverId, channelId, path, volumeMultiplier, undefined, forcePlay);
    } else {
        throw new InteractionError(ErrorTypes.FILE_NOT_FOUND);
    }
}

export async function stopPlaying(serverId: Snowflake, isAdmin: boolean): Promise<void> {
    if (!forcePlayLock[serverId] || isAdmin) {
        const connection = voiceHelper.getActiveConnection(serverId);
        if (connection) {
            const player = getAudioPlayer(serverId);
            player.stop(true);
        } else {
            throw new InteractionError(ErrorTypes.SERVER_ID_NOT_FOUND);
        }
    } else {
        throw new InteractionError(ErrorTypes.PLAY_NOT_ALLOWED);
    }
}
