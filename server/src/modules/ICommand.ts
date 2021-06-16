import { Message } from "discord.js";

export interface ICommand {
    isCommand(content: string): boolean;
    doWork(message: Message): void;
}