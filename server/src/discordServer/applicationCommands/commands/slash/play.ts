import { getCommandLangKey } from '../../commandLang';
import { CommandLangKey } from '../../types/lang.types';
import type { ChatCommand } from '../../../../interfaces/command';
import {
    getLangSlashCommandBuilder,
    getSoundSelection,
    getVolumeInput,
    playSoundThroughInteraction
} from '../../../utils/commonCommand.utils';


const { soundCommandName, soundOption, autocomplete } = getSoundSelection();
const { volumeCommandName, volumeOption } = getVolumeInput();

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.PLAY_NAME, CommandLangKey.PLAY_DESCRIPTION)
        .addStringOption(soundOption)
        .addIntegerOption(volumeOption)
        .toJSON(),

    async execute(interaction) {
        const result = await playSoundThroughInteraction(interaction, soundCommandName, volumeCommandName);
        return result ?? getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
    autocomplete,
};

export default command;
