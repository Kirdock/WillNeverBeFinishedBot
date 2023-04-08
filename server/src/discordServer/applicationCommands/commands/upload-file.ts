import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { databaseHelper } from '../../../services/databaseHelper';
import { APPLICATION_COMMAND_MAX_CHOICES } from '../../limits';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileHelper } from '../../../services/fileHelper';
import { Readable } from 'stream';
import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../commandLang';
import { CommandLangKey } from '../types/lang.types';

const attachmentName = getDefaultCommandLang(CommandLangKey.UPLOAD_FILE_ATTACHMENT_NAME);
const categoryName = getDefaultCommandLang(CommandLangKey.UPLOAD_FILE_CATEGORY_NAME);
const fileNameOptionName = getDefaultCommandLang(CommandLangKey.UPLOAD_FILE_FILE_NAME_NAME);

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName(getDefaultCommandLang(CommandLangKey.UPLOAD_FILE_BASE_COMMAND_NAME))
        .setDescription(getDefaultCommandLang(CommandLangKey.UPLOAD_FILE_BASE_COMMAND_DESCRIPTION))
        .setNameLocalizations(getCommandLang(CommandLangKey.UPLOAD_FILE_BASE_COMMAND_NAME))
        .setDescriptionLocalizations(getCommandLang(CommandLangKey.UPLOAD_FILE_BASE_COMMAND_DESCRIPTION))
        .addAttachmentOption((option) =>
            option
                .setName(attachmentName)
                .setNameLocalizations(getCommandLang(CommandLangKey.UPLOAD_FILE_ATTACHMENT_NAME))
                .setDescription(getDefaultCommandLang(CommandLangKey.UPLOAD_FILE_ATTACHMENT_DESCRIPTION))
                .setDescriptionLocalizations(getCommandLang(CommandLangKey.UPLOAD_FILE_ATTACHMENT_DESCRIPTION))
                .setRequired(true)
        ).addStringOption((option) =>
            option
                .setName(categoryName)
                .setNameLocalizations(getCommandLang(CommandLangKey.UPLOAD_FILE_CATEGORY_NAME))
                .setDescription(getDefaultCommandLang(CommandLangKey.UPLOAD_FILE_CATEGORY_DESCRIPTION))
                .setDescriptionLocalizations(getCommandLang(CommandLangKey.UPLOAD_FILE_CATEGORY_DESCRIPTION))
                .setRequired(true)
                .setAutocomplete(true)
        ).addStringOption((option) =>
            option
                .setName(fileNameOptionName)
                .setNameLocalizations(getCommandLang(CommandLangKey.UPLOAD_FILE_FILE_NAME_NAME))
                .setDescription(getDefaultCommandLang(CommandLangKey.UPLOAD_FILE_FILE_NAME_DESCRIPTION))
                .setDescriptionLocalizations(getCommandLang(CommandLangKey.UPLOAD_FILE_FILE_NAME_DESCRIPTION))
        )
        .toJSON(),
    async execute(interaction) {
        const attachment = interaction.options.getAttachment(attachmentName, true);
        const category = interaction.options.getString(categoryName, true);

        if (!interaction.guildId) {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_INVALID_GUILD);
        }

        if (attachment.contentType !== 'audio/mpeg') {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_INVALID_AUDIO_CONTENT_TYPE);
        }

        const name = `${uuidv4()}${extname(attachment.url)}`;
        const response = await fetch(attachment.url);
        const fileName = interaction.options.getString(fileNameOptionName) || fileHelper.getFileName(attachment.url);
        const stream = Readable.from(Buffer.from(await response.arrayBuffer()));

        await databaseHelper.addSoundMetaThroughStream(stream, fileHelper.generateSoundPath(name), fileName, category, interaction.user.id, interaction.guildId);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS_UPLOAD);
    },
    async autocomplete(interaction) {
        if (!interaction.guildId) {
            return [];
        }

        const value = interaction.options.getFocused();
        const categories = await databaseHelper.findSoundCategories(value, interaction.guildId, APPLICATION_COMMAND_MAX_CHOICES);
        return categories.map((category) => ({
            value: category,
            name: category,
        }));
    },
};

export default command;
