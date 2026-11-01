import express from 'express';
import { discordBot } from './discordServer/DiscordBot.js';
import { scopedLogger } from './services/logHelper.js';
import { readApplicationCommands } from './discordServer/applicationCommands/applicationManager.js';
import { databaseHelper } from './services/databaseHelper.js';
import { migrateCheck } from './services/migratorHelper.js';
import { registerRoutes } from './webserver/routes.js';
import { startServer } from './webserver/server.js';

const logger = scopedLogger('SERVER');
void start();

async function start(): Promise<void> {
    try {
        const router = express.Router();

        await databaseHelper.run();
        await migrateCheck();
        await readApplicationCommands();
        await discordBot.run();

        registerRoutes(router);
        startServer(router);
    } catch (e) {
        logger.error('SERVER', e);
        process.exit(1);
    }
}
