import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { buildSteamLinkOutOfMessage } from '../../utils/steam.utils';
import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';

const urlOptionName = getDefaultCommandLang(CommandLangKey.POST_STEAM_LINK_URL_NAME);

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.POST_STEAM_LINK_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.POST_STEAM_LINK_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.POST_STEAM_LINK_DESCRIPTION))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.POST_STEAM_LINK_DESCRIPTION))
        .addStringOption((option) =>
            option
                .setName(urlOptionName)
                .setNameLocalizations(getCommandLang(CommandLangKey.POST_STEAM_LINK_URL_NAME))
                .setDescription(getDefaultCommandLang(CommandLangKey.POST_STEAM_LINK_URL_DESCRIPTION))
                .setDescriptionLocalizations(getCommandLang(CommandLangKey.POST_STEAM_LINK_URL_DESCRIPTION))
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
