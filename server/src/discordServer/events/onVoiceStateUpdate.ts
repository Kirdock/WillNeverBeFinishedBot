import type { Client, Snowflake, VoiceState } from 'discord.js';
import { Events } from 'discord.js';
import type { IServerSettings } from '../../../../shared/interfaces/server-settings';
import { databaseHelper } from '../../services/databaseHelper';

export default async function onVoiceStateUpdate(client: Client<true>) {
    // prevent circular import
    const { playIntro, playSound } = await import( '../../services/musicPlayer');
    const { voiceHelper } = await import( '../../services/voiceHelper');

    client.on(Events.VoiceStateUpdate, async (oldState: VoiceState, newState: VoiceState) => {
        const serverInfo: IServerSettings = await databaseHelper.getServerSettings(newState.guild.id);
        const newUserChannelId: Snowflake | undefined = newState.channel?.id;
        const oldUserChannelId: Snowflake | undefined = oldState.channel?.id;
        const oldChannelMemberCount = oldState.channel?.members.size ?? 0;
        const newChannelMemberCount = newState.channel?.members.size ?? 0;

        // VoiceState update
        if (newUserChannelId === oldUserChannelId) {
            // unmute
            if (serverInfo.playIntroWhenUnmuted && oldState.selfDeaf && !newState.selfDeaf) {
                await playIntro(newState, serverInfo.defaultIntro);
            }
        } else {
            // user joins
            if (!oldUserChannelId) {
                if (serverInfo.playIntro && (!serverInfo.minUser || newChannelMemberCount > 1)) {
                    await playIntro(newState, serverInfo.defaultIntro);
                }
            }
            // user leaves
            else if (!newUserChannelId) {
                if (serverInfo.playOutro && serverInfo.defaultOutro && oldChannelMemberCount > 0) {
                    const soundMeta = await databaseHelper.getSoundMeta(serverInfo.defaultOutro);
                    if (soundMeta) {
                        await playSound(oldState.guild.id, oldUserChannelId, soundMeta.path);
                    }
                    // else remove intro if not found?
                }
            }
            // user switches channel
            else {
                //
            }

            // bot leaves if it is the only remaining member in the voice channel
            if (oldChannelMemberCount === 1 && oldState.channel?.members.get(client.user.id)) {
                voiceHelper.disconnectVoice(oldState.guild.id);
            } else if (newChannelMemberCount === 1 && newState.channel?.members.get(client.user.id)) {
                voiceHelper.disconnectVoice(newState.guild.id);
            }
        }
    });
}
