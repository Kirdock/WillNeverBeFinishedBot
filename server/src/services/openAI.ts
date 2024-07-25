import { OpenAI as OpenAIApi } from 'openai';
import { EnvironmentConfig } from './config';

class OpenAI {
    private readonly openAi: OpenAIApi;

    constructor(apiToken: string) {
        this.openAi = new OpenAIApi({
            apiKey: apiToken,
        });
    }

    public async getResponse(text: string): Promise<string | null> {
        const completion = await this.openAi.chat.completions.create({
            model: EnvironmentConfig.OPENAI_API_MODEL || 'gpt-3.5-turbo',
            messages: [{
                content: text,
                role: 'user'
            }],
            temperature: 0.9,
        });
        return completion.choices[0].message.content;
    }
}

export default EnvironmentConfig.OPENAI_API_KEY ? new OpenAI(EnvironmentConfig.OPENAI_API_KEY) : undefined;
