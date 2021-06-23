import { Message } from 'discord.js';
import { Command } from './Command';

export class QuestionCommand extends Command{
    protected readonly commandText = '?';
    private readonly answers = ['Na','Jo','Frag doch einfach nochmal'];

    public isCommand(content: string): boolean {
        return content.endsWith('?');
    }

    public async doWork(message: Message): Promise<void>{
        const reply = this.answers[Math.floor(Math.random()*this.answers.length)];
        message.reply(reply);
    }
}