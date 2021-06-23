import { Message } from 'discord.js';
import { DatabaseHelper } from '../services/databaseHelper';
import { FileHelper } from '../services/fileHelper';
import { Logger } from '../services/logger';
import { VoiceHelper } from '../services/voiceHelper';

export abstract class Command{
    protected abstract readonly commandText: string;

    constructor(protected logger: Logger, protected voiceHelper: VoiceHelper, protected databaseHelper: DatabaseHelper, protected fileHelper: FileHelper){}

    public abstract doWork(message: Message): Promise<void>;

    public isCommand(content: string): boolean {
        return content.startsWith(this.commandText);
    }

    protected getContentWithoutCommand(message: Message): string{
        return message.content.substring(this.commandText.length).trim();
    }
}