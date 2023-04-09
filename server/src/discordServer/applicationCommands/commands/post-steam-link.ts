import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType } from 'discord.js';
import { buildSteamLinkOutOfMessage } from '../../utils/steam.utils';
import { getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';
import { getScopedOption, getScopedSlashCommandBuilder } from '../../utils/commonCommand.utils';

const urlOptionName = getDefaultCommandLang(CommandLangKey.POST_STEAM_LINK_URL_NAME);

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.POST_STEAM_LINK_NAME, CommandLangKey.POST_STEAM_LINK_DESCRIPTION)
        .addStringOption((option) =>
            getScopedOption(option, CommandLangKey.POST_STEAM_LINK_URL_NAME, CommandLangKey.POST_STEAM_LINK_URL_DESCRIPTION)
                .setRequired(true)
        ).toJSON(),
    async execute(interaction) {
        const url = interaction.options.getString(urlOptionName, true);
        const steamLink = buildSteamLinkOutOfMessage(url);

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
