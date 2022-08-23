import express from 'express';
import { DiscordBot } from './discordServer/DiscordBot';
import { AuthHelper } from './services/authHelper';
import { DatabaseHelper } from './services/databaseHelper';
import { registerRoutes } from './webserver/routes';
import { IEnvironmentVariables } from './interfaces/environment-variables';
import { startServer } from './webserver/server';
import { logger } from './services/logHelper';
import { EnvironmentConfig } from './services/config';

if (EnvironmentConfig) {
    start(EnvironmentConfig);
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