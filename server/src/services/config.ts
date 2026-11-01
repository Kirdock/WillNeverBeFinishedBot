import type { IEnvironmentVariables, IRequiredEnvironmentVariables } from '../interfaces/environment-variables.js';
import { KEnvironmentVariables } from '../interfaces/environment-variables.js';
import { scopedLogger } from './logHelper.js';
import { asNumberOrUndefined } from '../utils/convertion.utils.js';

const logger = scopedLogger('CONFIG');

const env = process.env as Record<string, string | undefined>;

let config: IEnvironmentVariables;

if (checkRequiredEnvironmentVariables(env)) {
    config = setDefaultOptionalEnvironmentVariables(env);
}

export { config as EnvironmentConfig };

function setDefaultOptionalEnvironmentVariables(envs: IRequiredEnvironmentVariables): IEnvironmentVariables {
    return {
        ...envs,
        OWNERS: envs.OWNERS ?? '',
        VERSION: envs.VERSION || 'develop',
        DATABASE_CONTAINER_NAME: envs.DATABASE_CONTAINER_NAME || 'mongodb',
        MAX_RECORD_TIME_MINUTES: envs.MAX_RECORD_TIME_MINUTES || '',
        LOG_LEVEL: envs.LOG_LEVEL ?? '',
        OPENAI_API_KEY: env.OPENAI_API_KEY,
        OPENAI_API_MODEL: env.OPENAI_API_MODEL,
        MAX_INTRO_LENGTH_SECONDS: asNumberOrUndefined(env.MAX_INTRO_LENGTH_SECONDS) ?? 8,
    };
}

function checkRequiredEnvironmentVariables(envs: Partial<IRequiredEnvironmentVariables>): envs is IRequiredEnvironmentVariables {
    for (const env of KEnvironmentVariables) {
        if (!envs[env]) {
            logger.error(new Error(`env ${env} not provided`), 'Startup');
            process.exit(0);
        }
    }
    return true;
}
