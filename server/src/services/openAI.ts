import { Configuration, OpenAIApi } from 'openai';
import { EnvironmentConfig } from './config';

class OpenAI {
    private readonly openAi: OpenAIApi;

    constructor(apiToken: string) {
        const configuration = new Configuration({
            apiKey: apiToken,
        });
        this.openAi = new OpenAIApi(configuration);
    }

    public async getResponse(text: string): Promise<string | undefined> {
        const completion = await this.openAi.createChatCompletion({
            model: EnvironmentConfig.OPENAI_API_MODEL || 'gpt-3.5-turbo',
            messages: [{
                content: text,
                role: 'user'
            }],
        });
        return completion.data.choices[0].message?.content;
    }
}

export default EnvironmentConfig.OPENAI_API_KEY ? new OpenAI(EnvironmentConfig.OPENAI_API_KEY) : undefined;
