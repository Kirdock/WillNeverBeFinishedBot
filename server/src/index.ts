import express from 'express';
import { discordBot } from './discordServer/DiscordBot';
import { scopedLogger } from './services/logHelper';
import { readApplicationCommands } from './discordServer/applicationCommands/applicationManager';
import { databaseHelper } from './services/databaseHelper';
import { migrateCheck } from './services/migratorHelper';
import { registerRoutes } from './webserver/routes';
import { startServer } from './webserver/server';

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
