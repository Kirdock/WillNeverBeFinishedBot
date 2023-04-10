import type { ChatCommand } from '../../../interfaces/command';
import { ApplicationCommandType, PermissionsBitField } from 'discord.js';
import { getInteractionMetadata, getScopedSlashCommandBuilder, getVolumeInput } from '../../utils/commonCommand.utils';
import { CommandLangKey } from '../types/lang.types';
import { getCommandLangKey } from '../commandLang';
import { databaseHelper } from '../../../services/databaseHelper';

const { volumeCommandName, volumeOption } = getVolumeInput(true);

const command: ChatCommand = {
    type: ApplicationCommandType.ChatInput,
    data: getScopedSlashCommandBuilder(CommandLangKey.SET_USER_VOLUME_NAME, CommandLangKey.SET_USER_VOLUME_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addIntegerOption(volumeOption).toJSON(),
    async execute(interaction) {
        const { member, guildId } = getInteractionMetadata(interaction);

        const volume = interaction.options.getInteger(volumeCommandName, true);
        await databaseHelper.updateUserRecordVolume(guildId, member.id, volume);

        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    }
};

export default command;
