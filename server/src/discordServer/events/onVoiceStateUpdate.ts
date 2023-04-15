import type { Client, VoiceState } from 'discord.js';
import { Events, MessageFlags } from 'discord.js';
import { databaseHelper } from '../../services/databaseHelper';
import { generateChannelMention, generateUserMention } from '../../utils/discord.utils';

enum VoiceStateStatus {
    USER_JOINED_CHANNEL,
    USER_SWITCHED_CHANNEL,
    USER_LEFT_CHANNEL,
    USER_MUTED,
    USER_UNMUTED,
    USER_UNDEAFENED,
    USER_DEAFENED,
    UNKNOWN,
}

const messages: Record<VoiceStateStatus, (oldState: VoiceState, newState: VoiceState) => string> = {
    [VoiceStateStatus.USER_JOINED_CHANNEL]: (oldState: VoiceState, newState: VoiceState) =>  `joined channel ${newState.channelId && generateChannelMention(newState.channelId)}`,
    [VoiceStateStatus.USER_SWITCHED_CHANNEL]: (oldState: VoiceState, newState: VoiceState) =>  `switched to channel ${newState.channelId && generateChannelMention(newState.channelId)}`,
    [VoiceStateStatus.USER_LEFT_CHANNEL]: (oldState: VoiceState) =>  `left the channel ${oldState.channelId && generateChannelMention(oldState.channelId)}`,
    [VoiceStateStatus.USER_MUTED]: () => 'muted',
    [VoiceStateStatus.USER_UNMUTED]: ()=> 'unmuted',
    [VoiceStateStatus.USER_DEAFENED]: () => 'deafened',
    [VoiceStateStatus.USER_UNDEAFENED]: () => 'undeafened',
    [VoiceStateStatus.UNKNOWN]: ()=> 'unknown',
};

export default async function onVoiceStateUpdate(client: Client<true>) {
    // prevent circular import
    const { playIntro, playSound } = await import( '../../services/musicPlayer');
    const { voiceHelper } = await import( '../../services/voiceHelper');

    client.on(Events.VoiceStateUpdate, async (oldState: VoiceState, newState: VoiceState) => {
        const status = getVoiceUpdateStatus(oldState, newState, client);
        const serverInfo = await databaseHelper.getServerSettings(newState.guild.id);
        const oldUserChannelId = oldState.channelId;
        const oldChannelMemberCount = oldState.channel?.members.size ?? 0;
        const newChannelMemberCount = newState.channel?.members.size ?? 0;

        if (serverInfo.logVoiceStateChannel && newState.member && status !== VoiceStateStatus.UNKNOWN) {
            const channel = await newState.guild.channels.fetch(serverInfo.logVoiceStateChannel);
            if (channel?.isTextBased()) {
                channel.send({
                    content: `${generateUserMention(newState.member.id)} ${messages[status](oldState, newState)}`,
                    flags: [MessageFlags.SuppressNotifications]
                });
            }
        }

        if (status === VoiceStateStatus.USER_UNDEAFENED && serverInfo.playIntroWhenUnmuted) {
            await playIntro(newState, serverInfo.defaultIntro);
            return;
        }

        if (status === VoiceStateStatus.USER_JOINED_CHANNEL && serverInfo.playIntro && (!serverInfo.minUser || newChannelMemberCount > 1)) {
            await playIntro(newState, serverInfo.defaultIntro);
            return;
        }

        if (status === VoiceStateStatus.USER_LEFT_CHANNEL && oldUserChannelId && serverInfo.playOutro && serverInfo.defaultOutro && oldChannelMemberCount > 0) {
            const soundMeta = await databaseHelper.getSoundMeta(serverInfo.defaultOutro);
            if (soundMeta) {
                await playSound(oldState.guild.id, oldUserChannelId, soundMeta.path);
            }
            // else remove intro if not found?
        }

        if (status === VoiceStateStatus.USER_LEFT_CHANNEL || status === VoiceStateStatus.USER_SWITCHED_CHANNEL) {
            if (oldChannelMemberCount === 1 && oldState.channel?.members.get(client.user.id)) {
                voiceHelper.disconnectVoice(oldState.guild.id);
            } else if (newChannelMemberCount === 1 && newState.channel?.members.get(client.user.id)) {
                voiceHelper.disconnectVoice(newState.guild.id);
            }
        }
    });
}

function getVoiceUpdateStatus(oldState: VoiceState, newState: VoiceState, client: Client<true>): VoiceStateStatus {
    if (!oldState.channelId && newState.channelId && newState.member?.id !== client.user.id) {
        return VoiceStateStatus.USER_JOINED_CHANNEL;
    }
    if (oldState.channelId && !newState.channelId && oldState.member?.id !== client.user.id) {
        return VoiceStateStatus.USER_LEFT_CHANNEL;
    }
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        return VoiceStateStatus.USER_SWITCHED_CHANNEL;
    }
    if (oldState.selfDeaf !== newState.selfDeaf && newState.selfDeaf) {
        return VoiceStateStatus.USER_DEAFENED;
    }
    if (oldState.selfDeaf && oldState.selfDeaf !== newState.selfDeaf) {
        return VoiceStateStatus.USER_UNDEAFENED;
    }
    if (oldState.selfMute !== newState.selfMute && newState.selfMute) {
        return VoiceStateStatus.USER_MUTED;
    }
    if (oldState.selfMute && oldState.selfMute !== newState.selfMute) {
        return VoiceStateStatus.USER_UNMUTED;
    }
    return VoiceStateStatus.UNKNOWN;
}
