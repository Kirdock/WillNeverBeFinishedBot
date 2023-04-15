import type { ChatCommand } from '../../../../interfaces/command';
import { SlashCommandBuilder } from 'discord.js';

const command: ChatCommand = {
    data: new SlashCommandBuilder().setName('ping').setDescription('pong?').toJSON(),
    async execute() {
        return 'pong';
    },
};

export default command;
