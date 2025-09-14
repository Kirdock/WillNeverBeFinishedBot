import type { ChatCommand } from '../../../../interfaces/command';
import { buildSteamLinkOutOfMessage } from '../../../utils/steam.utils';
import { getCommandLangKey, getDefaultCommandLang } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import { getLangComponent, getLangSlashCommandBuilder } from '../../../utils/commonCommand.utils';

const urlOptionName = getDefaultCommandLang(CommandLangKey.POST_STEAM_LINK_URL_NAME);

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.POST_STEAM_LINK_NAME, CommandLangKey.POST_STEAM_LINK_DESCRIPTION)
        .addStringOption((option) =>
            getLangComponent(option, CommandLangKey.POST_STEAM_LINK_URL_NAME, CommandLangKey.POST_STEAM_LINK_URL_DESCRIPTION)
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
        };
    },
};

export default command;
