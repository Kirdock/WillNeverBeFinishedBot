import { SlashCommandBuilder } from 'discord.js';
import { databaseHelper } from '../../../services/databaseHelper';
import type { Command } from '../../../interfaces/command';
import { getInteractionMetadata } from '../applicationManager';
import { playSound } from '../../../services/musicPlayer';

const fileNotFoundMessage = 'De Datei gibts nit du Volltrottl!';
const userNotInVoiceChannelMessage = 'Du bist in kan Voice Channel!!';


const playCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a file in the voice channel you are in')
        .addStringOption((command) =>
            command
                .setName('file')
                .setDescription('Choose the file you want to be played')
                .setRequired(true)
        ).toJSON(),

    async execute(interaction) {
        const { member, guild } = await getInteractionMetadata(interaction);
        const file = interaction.options.getString('file', true);

        if (!member.voice.channelId) {
            return userNotInVoiceChannelMessage;
        }


        const meta = await databaseHelper.getSoundMetaByName(file);
        if (!meta?.path) {
            return fileNotFoundMessage;
        }
        await playSound(guild.id, member.voice.channelId, meta.path);

        return 'Successfully requested!';
    }
}

export default playCommand;