import { IEnvironmentVariables, IRequiredEnvironmentVariables, KEnvironmentVariables } from '../interfaces/environment-variables';
import { defaultLogLevel, logger } from './logHelper';

const env = process.env as Record<string, string | undefined>;

let config: IEnvironmentVariables | undefined;

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
        LOG_LEVEL: envs.LOG_LEVEL || defaultLogLevel,
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