import { getCommandLangKey } from '../../commandLang.js';
import { CommandLangKey } from '../../types/lang.types.js';
import type { ChatCommand } from '../../../../interfaces/command.js';
import {
    getLangSlashCommandBuilder,
    getSoundSelection,
    getVolumeInput,
    playSoundThroughInteraction
} from '../../../utils/commonCommand.utils.js';


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
