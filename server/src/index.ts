import express from "express";
import { DiscordBot } from "./discordServer/DiscordBot";
import { AuthHelper } from "./services/authHelper";
import { DatabaseHelper } from "./services/databaseHelper";
import { FileHelper } from "./services/fileHelper";
import { Logger } from "./services/logger";
import { Router } from "./webserver/routes";
import { WebServer } from "./webserver/server";

if (!process.env.CLIENT_TOKEN) {
    throw Error('Client token not provided!');
}
else if (!process.env.CLIENT_SECRET) {
    throw Error('Client secret not provided!');
}

setDefaultEnvironment();
start();

async function start() {
    const logger: Logger = new Logger();
    try{
        const fileHelper: FileHelper = new FileHelper(logger);
        const databaseHelper = new DatabaseHelper(logger, fileHelper);
        await databaseHelper.run();
        const discordBot: DiscordBot = new DiscordBot(databaseHelper, fileHelper, logger);
        const authHelper = new AuthHelper(logger, databaseHelper, discordBot);
        const router = express.Router();
        new Router(discordBot, router, fileHelper, databaseHelper, logger, authHelper);
        new WebServer(router, authHelper, fileHelper, logger);
    }
    catch(e) {
        logger.error(e, 'Server start');
        process.exit(1);
    }
}


function setDefaultEnvironment() {
    process.env.PORT ||= '4599';
    process.env.WEBTOKEN_SECRET ||= 'Q8{He@4et!5Prhr/Zy:s';
    process.env.SCOPE ||= 'identify';
    process.env.PREFIXES ||= '!';
    process.env.OWNERS ||= '';
    process.env.DATABASE_NAME ||= 'myDatabase';
    process.env.DATABASE_USER ||= 'root';
    process.env.DATABASE_PASSWORD ||= 'Q8{He@4et!5Prhr/Zy:s';
    process.env.HOST ||= 'http://localhost:500';
}