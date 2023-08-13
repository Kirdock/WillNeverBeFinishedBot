import type { ChatCommand } from '../../../../interfaces/command';
import { databaseHelper } from '../../../../services/databaseHelper';
import { APPLICATION_COMMAND_MAX_CHOICES } from '../../../constants';
import { fileHelper } from '../../../../services/fileHelper';
import { Readable } from 'stream';
import { getCommandLangKey, getDefaultCommandLang } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import {
    getInteractionMetadata,
    getLangComponent,
    getLangSlashCommandBuilder
} from '../../../utils/commonCommand.utils';

const attachmentName = getDefaultCommandLang(CommandLangKey.UPLOAD_FILE_ATTACHMENT_NAME);
const categoryName = getDefaultCommandLang(CommandLangKey.UPLOAD_FILE_CATEGORY_NAME);
const fileNameOptionName = getDefaultCommandLang(CommandLangKey.UPLOAD_FILE_FILE_NAME_NAME);

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.UPLOAD_FILE_BASE_COMMAND_NAME, CommandLangKey.UPLOAD_FILE_BASE_COMMAND_DESCRIPTION)
        .addAttachmentOption((option) =>
            getLangComponent(option, CommandLangKey.UPLOAD_FILE_ATTACHMENT_NAME, CommandLangKey.UPLOAD_FILE_ATTACHMENT_DESCRIPTION)
                .setRequired(true)
        ).addStringOption((option) =>
            getLangComponent(option, CommandLangKey.UPLOAD_FILE_CATEGORY_NAME, CommandLangKey.UPLOAD_FILE_CATEGORY_DESCRIPTION)
                .setRequired(true)
                .setAutocomplete(true)
        ).addStringOption((option) =>
            getLangComponent(option, CommandLangKey.UPLOAD_FILE_FILE_NAME_NAME, CommandLangKey.UPLOAD_FILE_FILE_NAME_DESCRIPTION)
        )
        .toJSON(),
    async execute(interaction) {
        const attachment = interaction.options.getAttachment(attachmentName, true);
        const category = interaction.options.getString(categoryName, true);
        const { guildId } = getInteractionMetadata(interaction);

        if (attachment.contentType !== 'audio/mpeg') {
            return getCommandLangKey(interaction, CommandLangKey.ERRORS_INVALID_AUDIO_CONTENT_TYPE);
        }

        await interaction.deferReply({
            ephemeral: true
        });

        const name = fileHelper.generateUniqueFileName(attachment.url);
        const fileName = interaction.options.getString(fileNameOptionName) || fileHelper.getFileName(attachment.url);
        const response = await fetch(attachment.url);
        const stream = Readable.from(Buffer.from(await response.arrayBuffer()));

        await databaseHelper.addSoundMetaThroughStream(stream, fileHelper.generateSoundPath(name), fileName, category, interaction.user.id, guildId);

        await interaction.editReply(getCommandLangKey(interaction, CommandLangKey.SUCCESS_UPLOAD));
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
