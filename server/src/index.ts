import express from 'express';
import { DiscordBot } from './discordServer/DiscordBot';
import { AuthHelper } from './services/authHelper';
import { DatabaseHelper } from './services/databaseHelper';
import { registerRoutes } from './webserver/routes';
import { IEnvironmentVariables, IRequiredEnvironmentVariables, KEnvironmentVariables } from './interfaces/environment-variables';
import { startServer } from './webserver/server';
import { defaultLogLevel, logger } from './services/logHelper';

const env = process.env as Record<string, string | undefined>;

if (checkRequiredEnvironmentVariables(env)) {
    const config = setDefaultOptionalEnvironmentVariables(env);
    start(config);
}

async function start(config: IEnvironmentVariables): Promise<void> {
    try {
        const databaseHelper = new DatabaseHelper(config);
        await databaseHelper.run(config);
        const discordBot: DiscordBot = new DiscordBot(databaseHelper, config);
        const authHelper = new AuthHelper(databaseHelper, discordBot, config);
        const router = express.Router();
        registerRoutes(discordBot, router, databaseHelper, authHelper);
        startServer(router, authHelper, logger, config);
    } catch (e) {
        logger.error(e as Error, 'Server start');
        process.exit(1);
    }
}


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