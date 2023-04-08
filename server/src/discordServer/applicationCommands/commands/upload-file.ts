import type { Command } from '../../../interfaces/command';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import { databaseHelper } from '../../../services/databaseHelper';
import { APPLICATION_COMMAND_MAX_CHOICES } from '../../limits';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileHelper } from '../../../services/fileHelper';
import { Readable } from 'stream';

const attachmentName = 'file';
const categoryName = 'category';
const fileNameOptionName = 'file-name';

const command: Command = {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName('upload')
        .setDescription('Upload a sound file')
        .setNameLocalizations({
            de: 'upload'
        })
        .setDescriptionLocalizations({
            de: 'Lade eine Audiodatei hoch'
        })
        .addAttachmentOption((option) =>
            option
                .setName(attachmentName)
                .setDescription('Attach you audio file')
                .setRequired(true)
        ).addStringOption((option) =>
            option
                .setName(categoryName)
                .setDescription('Sound category')
                .setRequired(true)
                .setAutocomplete(true)
        ).addStringOption((option) =>
            option
                .setName(fileNameOptionName)
                .setDescription('File name (optional)')
        ).toJSON(),
    async execute(interaction) {
        const attachment = interaction.options.getAttachment(attachmentName, true);
        const category = interaction.options.getString(categoryName, true);

        if (!interaction.guildId) {
            return interaction.locale === 'de' ? 'Ungültige server ID!' : 'Invalid guild id!';
        }

        if (attachment.contentType !== 'audio/mpeg') {
            return interaction.locale === 'de' ? 'Bist zbled um a Audiodatei auszuwöhln oda wos?' : 'Invalid file format!';
        }

        const name = `${uuidv4()}${extname(attachment.url)}`;
        const response = await fetch(attachment.url);
        const fileName = interaction.options.getString(fileNameOptionName) || fileHelper.getFileName(attachment.url);

        if (!response.body) {
            return 'File can\'t be fetched';
        }

        const stream = Readable.from(Buffer.from(await response.arrayBuffer()));
        await databaseHelper.addSoundMetaThroughStream(stream, fileHelper.generateSoundPath(name), fileName, category, interaction.user.id, interaction.guildId);

        return 'uploaded!';
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
    }
};

export default command;
