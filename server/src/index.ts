import express from 'express';
import { DiscordBot } from './discordServer/DiscordBot';
import { AuthHelper } from './services/authHelper';
import { DatabaseHelper } from './services/databaseHelper';
import { FileHelper } from './services/fileHelper';
import { Logger } from './services/logger';
import { Router } from './webserver/routes';
import { WebServer } from './webserver/server';
import { IEnvironmentVariables, IRequiredEnvironmentVariables, KEnvironmentVariables } from './interfaces/environment-variables';

const defaultLogLevel = 'debug';
const logger: Logger = new Logger(process.env.LOG_LEVEL || defaultLogLevel);

if (checkRequiredEnvironmentVariables(process.env)) {
    const config = setDefaultOptionalEnvironmentVariables(process.env);
    start(config);
}

async function start(config: IEnvironmentVariables): Promise<void> {
    try {
        const fileHelper: FileHelper = new FileHelper(logger);
        const databaseHelper = new DatabaseHelper(logger, fileHelper, config);
        await databaseHelper.run(config);
        const discordBot: DiscordBot = new DiscordBot(databaseHelper, fileHelper, logger, config);
        const authHelper = new AuthHelper(logger, databaseHelper, discordBot, config);
        const router = express.Router();
        new Router(discordBot, router, fileHelper, databaseHelper, logger, authHelper);
        new WebServer(router, authHelper, fileHelper, logger, config);
    } catch (e) {
        logger.error(e, 'Server start');
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