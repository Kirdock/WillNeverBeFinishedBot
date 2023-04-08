import { registerApplicationCommands, unregisterApplicationCommands } from '../applicationManager';
import { ApplicationCommandType, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../../interfaces/command';

const command: Command =  {
    type: ApplicationCommandType.ChatInput,
    data: new SlashCommandBuilder()
        .setName('re-register')
        .setDescription('Command for re-registering slash commands')
        .toJSON(),
    async execute(interaction) {
        await unregisterApplicationCommands(interaction.client);
        await registerApplicationCommands(interaction.client);
        return 're-registered';
    },
};

export default command;