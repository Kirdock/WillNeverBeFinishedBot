import type { Command } from '../../../interfaces/command';
import { SlashCommandBuilder } from 'discord.js';
import { unregisterApplicationCommands } from '../applicationManager';


const command: Command =  {
    data: new SlashCommandBuilder()
        .setName('unregister')
        .setDescription('Command for unregistering slash commands')
        .toJSON(),
    async execute(interaction) {
        await unregisterApplicationCommands(interaction.client);
        return 'unregistered';
    },
};
export default command;