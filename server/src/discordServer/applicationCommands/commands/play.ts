import type { AutocompleteInteraction } from 'discord.js';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { databaseHelper } from '../../../services/databaseHelper';
import type { Command } from '../../../interfaces/command';
import { getInteractionMetadata } from '../applicationManager';
import { playSound } from '../../../services/musicPlayer';
import { APPLICATION_COMMAND_MAX_CHOICES } from '../../limits';
import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';

const fileCommandName = getDefaultCommandLang(CommandLangKey.PLAY_FILE_NAME);

const playCommand: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.PLAY_NAME))
        .setNameLocalizations(getCommandLang(CommandLangKey.PLAY_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.PLAY_DESCRIPTION))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.PLAY_DESCRIPTION))
        .addStringOption((command) =>
            command
                .setName(fileCommandName)
                .setNameLocalizations(getCommandLang(CommandLangKey.PLAY_FILE_NAME))
                .setDescription(getDefaultCommandLang(CommandLangKey.PLAY_FILE_DESCRIPTION))
                .setDescriptionLocalizations(getCommandLang(CommandLangKey.PLAY_FILE_DESCRIPTION))
                .setRequired(true)
                .setAutocomplete(true)
        ).toJSON(),

    async execute(interaction) {
        const { member, guild } = await getInteractionMetadata(interaction);
        const file = interaction.options.getString(fileCommandName, true);

        if (!member.voice.channelId) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_NOT_IN_VOICE_CHANNEL);
        }


        const meta = await databaseHelper.getSoundMetaByName(file);
        if (!meta?.path) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_FILE_NOT_FOUND);
        }
        await playSound(guild.id, member.voice.channelId, meta.path);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
    async autocomplete(interaction: AutocompleteInteraction) {
        if (!interaction.guildId) {
            return [];
        }

        const value = interaction.options.getFocused();
        const sounds = await databaseHelper.getSoundsMetaByName(value, interaction.guildId, APPLICATION_COMMAND_MAX_CHOICES);
        return sounds.map((sound) => (
            {
                value: sound.fileName,
                name: sound.fileName,
            }
        ));
    },
};

export default playCommand;
