import type { MessageCommand } from '../../../../interfaces/command.js';
import { ApplicationCommandType } from 'discord.js';
import { buildSteamLinkOutOfMessage } from '../../../utils/steam.utils.js';
import { getCommandLangKey } from '../../commandLang.js';
import { CommandLangKey } from '../../types/lang.types.js';
import { getScopedContextMenuBuilder } from '../../../utils/commonCommand.utils.js';

const command: MessageCommand = {
    data: getScopedContextMenuBuilder(CommandLangKey.GENERATE_STEAM_LINK_NAME)
        .setType(ApplicationCommandType.Message)
        .toJSON(),
    async execute(interaction) {
        const steamLink = buildSteamLinkOutOfMessage(interaction.targetMessage.content);
        if (!steamLink) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_NO_STEAM_URL);
        }
        return {
            content: steamLink,
        };
    },
};

export default command;
