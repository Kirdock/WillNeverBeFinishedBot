import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, ContextMenuCommandBuilder } from 'discord.js';
import { buildSteamLinkOutOfMessage } from '../../utils/steam.utils';
import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';

const command: Command = {
    type: ApplicationCommandType.Message,
    data: new ContextMenuCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.GENERATE_STEAM_LINK_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.GENERATE_STEAM_LINK_NAME))
        .setType(ApplicationCommandType.Message)
        .toJSON(),
    async execute(interaction) {
        const steamLink = buildSteamLinkOutOfMessage(interaction.targetMessage.content);
        if (!steamLink) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_NO_STEAM_URL);
        }
        return {
            content: steamLink,
            ephemeral: false,
        };
    },
};

export default command;