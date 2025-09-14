import multer from 'multer';
import { extname } from 'path';
import type { Request, Response, Router as rs } from 'express';
import { databaseHelper } from '../services/databaseHelper';
import { authHelper } from '../services/authHelper';
import { ErrorTypes } from '../services/ErrorTypes';
import type { GuildMember } from 'discord.js';
import type { AudioExportType } from '../../../shared/models/types';
import type { IServerSettings } from '../../../shared/interfaces/server-settings';
import type { ILog } from '../interfaces/log';
import { getRequestBaseLocale, getResponseMessage } from '../services/localeService';
import type { IResponseMessages } from '../interfaces/response-messages';
import type { IUserPayload } from '../interfaces/user-payload';
import type { IUserVoiceSettings } from '../../../shared/interfaces/user-voice-settings';
import { createUserVoiceSetting } from '../utils/User';
import { sortUsers } from '../utils/sort';
import { getNormalizedDate } from '../utils/date';
import { scopedLogger } from '../services/logHelper';
import { discordBot } from '../discordServer/DiscordBot';
import { voiceHelper } from '../services/voiceHelper';
import { fileHelper } from '../services/fileHelper';
import { playSound, requestSound, stopPlaying } from '../services/musicPlayer';
import { mapUserSettingsToDict } from '../utils/convertion.utils';
import { recordHelper } from '../services/recordHelper';
import type { ObjectId } from 'mongodb';
import dataService from '../services/data.service';
import { getCommandLangKey } from '../discordServer/applicationCommands/commandLang';
import { CommandLangKey } from '../discordServer/applicationCommands/types/lang.types';

const logger = scopedLogger('API');

export function registerRoutes(router: rs) {
    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, fileHelper.soundFolder);
        },
        filename: (_req, file, cb) => {
            cb(null, fileHelper.generateUniqueFileName(file.originalname));
        },
    });
    const upload = multer({ storage });

    router.route('/login')
        .post(async (req: Request, res: Response) => {
            try {
                const authToken = await authHelper.login(req.body.code);
                res.statusMessage = getResponseMessage(req, 'LOGIN_SUCCESSFUL');
                res.status(200).send(authToken);
            } catch (error) {
                logger.error(error as Error, 'Login');
                res.statusMessage = getResponseMessage(req, 'LOGIN_FAILED');
                res.status(400).end();
            }
        });

    router.route('/metadata').get((req: Request, res: Response) => {
        try {
            const result = getPayload(res);
            // TODO: permission service
            //  should have "hasPermission" function with serverId and optionally a role (hasPermission(role = admin))
            res.json({
                isSuperAdmin: discordBot.isSuperAdmin(result.id),
                username: result.username,
                // adminServers: discordBot.getAdminServerIds()
            });
        } catch (e) {
            defaultError(e as Error, res, req);
        }
    });

    router.route('/logs/:serverId')
        .get(async (req, res) => {
            try {
                const result = getPayload(res);
                if (!discordBot.isSuperAdmin(result.id) && !(await discordBot.isUserAdminInServer(result.id, req.params.serverId))) {
                    notAdmin(res, req);
                    return;
                }
                const logs: ILog[] = await databaseHelper.getLogs(req.params.serverId, +(req.query.pageSize as string), +(req.query.pageKey as string), +(req.query.fromTime as string));
                await discordBot.mapUsernames(logs, 'userId');
                res.status(200).json(logs);

            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/servers')
        .get(async (req, res) => {
            try {
                const result = getPayload(res);
                const servers = await discordBot.getUserServers(result.id, true);
                res.status(200).json(servers);
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/serverSettings')
        .post(async (req, res) => {
            try {
                const result = getPayload(res);
                const settings: IServerSettings = req.body.serverSettings;
                const valid = discordBot.isSuperAdmin(result.id) || await discordBot.isUserAdminInServer(result.id, settings.id);
                if (!valid) {
                    notAdmin(res, req);
                    return;
                }
                await databaseHelper.updateServerSettings(settings);
                const connection = voiceHelper.getActiveConnection(settings.id);
                if (connection) {
                    if (settings.recordVoice) {
                        recordHelper.startRecording(connection);
                    } else {
                        recordHelper.stopRecording(connection);
                    }
                }
                res.statusMessage = getResponseMessage(req, 'SERVER_SETTINGS_UPDATED');
                res.status(200).end();
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/serverSettings/:serverId')
        .get(async (req, res) => {
            try {
                const result = getPayload(res);
                const valid = discordBot.isSuperAdmin(result.id) || await discordBot.isUserAdminInServer(result.id, req.params.serverId);
                if (!valid) {
                    notAdmin(res, req);
                    return;
                }
                res.status(200).json(await databaseHelper.getServerSettings(req.params.serverId));
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/stopPlaying/:serverId')
        .get(async (req, res) => {
            try {
                const result = getPayload(res);
                const status: boolean = await discordBot.isUserInServer(result.id, req.params.serverId);
                if (!status) {
                    notInServer(res, result.id, req.params.serverId, req);
                    return;
                }
                const isAdmin: boolean = await discordBot.isUserAdminInServer(result.id, req.params.serverId) || discordBot.isSuperAdmin(result.id);
                try {
                    await stopPlaying(req.params.serverId, isAdmin);
                    res.statusMessage = getResponseMessage(req, 'SOUND_PLAY_STOPPED');
                    res.status(200).end();
                } catch (error) {
                    const message = (error as Error).message;
                    const errorToResponseMessageKey = (message: string): keyof IResponseMessages=> {
                        if (message === ErrorTypes.SERVER_ID_NOT_FOUND) {
                            return 'SERVER_NOT_FOUND';
                        }
                        if (message === ErrorTypes.PLAY_NOT_ALLOWED) {
                            return 'SOUND_PLAY_NOT_ALLOWED';
                        }
                        return 'DEFAULT_ERROR';
                    };
                    res.statusMessage = getResponseMessage(req, errorToResponseMessageKey(message));
                    res.status(500).end();
                }
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/sound/:soundId')
        .get(async (req, res) => {
            try {
                const result = getPayload(res);
                const meta = await databaseHelper.getSoundMeta(req.params.soundId);

                if (!meta || !(await discordBot.isUserInServer(result.id, meta.serverId))) {
                    res.statusMessage = getResponseMessage(req, 'SOUND_NOT_FOUND');
                    res.status(404).end();
                    return;
                }
                res.status(200).download(meta.path, meta.fileName + extname(meta.path));
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/voiceRecorder/server/:serverId/userSettings')
        .get(async (req: Request, res: Response) => {
            try {
                const result = getPayload(res);
                const serverId = req.params.serverId;

                if (!(await discordBot.isUserAdminInServerOrSuperAdmin(result.id, serverId))) {
                    res.statusMessage = getResponseMessage(req, 'NOT_ADMIN');
                    res.status(404).end();
                    return;
                }
                const userSettings = await databaseHelper.getUsersRecordVolume(serverId);
                await discordBot.addMissingUsers(userSettings, serverId, createUserVoiceSetting);
                await discordBot.mapUsernames(userSettings, 'id');

                res.json(sortUsers(userSettings as IUserVoiceSettings[]));
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/voiceRecorder/server/:serverId/userSettings/user/:userId')
        .put(async (req: Request, res: Response) => {
            try {
                const result = getPayload(res);
                const { serverId, userId } = req.params;
                const volume = +req.body.volume;
                if (!(await discordBot.isUserAdminInServerOrSuperAdmin(result.id, serverId))) {
                    res.statusMessage = getResponseMessage(req, 'NOT_ADMIN');
                    res.status(404).end();
                    return;
                }
                if (!volume || isNaN(volume)) {
                    res.status(400).end();
                    return;
                }
                await databaseHelper.updateUserRecordVolume(serverId, userId, volume);
                res.statusMessage = getResponseMessage(req, 'USER_VOLUME_UPDATED');
                res.status(200).end();
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/recordVoice/:serverId')
        .get(async (req: Request, res: Response) => {
            try {
                const result = getPayload(res);
                const { serverId } = req.params;

                if (!(await discordBot.isUserInServer(result.id, serverId))) {
                    res.statusMessage = getResponseMessage(req, 'SERVER_NOT_FOUND');
                    res.status(404).end();
                    return;
                }
                const serverSettings = await databaseHelper.getServerSettings(serverId);
                const exportType = req.query.recordType?.toString() as AudioExportType | undefined;
                const fileName = getNormalizedDate();
                if (exportType === 'single') {
                    res.type('audio/mp3').attachment(`${fileName}.mp3`);

                } else {
                    res.type('application/zip').attachment(`${fileName}-all-streams.zip`);
                }

                const succeeded = await recordHelper.getRecordedVoice(res, serverId, exportType, req.query.minutes ? +(req.query.minutes.toString()) : undefined, mapUserSettingsToDict(serverSettings));

                if (!succeeded) {
                    res.statusMessage = getResponseMessage(req, 'RECORDING_NOT_FOUND');
                    res.status(404).end();
                    return;
                }
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/sounds/:serverId')
        .get(async (req, res) => {
            try {
                const result = getPayload(res);
                const status = await discordBot.isUserInServer(result.id, req.params.serverId);
                if (!status) {
                    notInServer(res, result.id, req.params.serverId, req);
                    return;
                }
                const soundMetas = await databaseHelper.getSoundsMeta([req.params.serverId], +(req.query.fromTime as string));
                try {
                    await discordBot.mapUsernames(soundMetas, 'userId');
                    const result = soundMetas.map((meta) => {
                        const { path, ...data } = meta;
                        return data;
                    });
                    res.status(200).json(result);
                } catch (error) {
                    logger.error(error as Error, 'Fetching user failed');
                    res.statusMessage = getResponseMessage(req, 'SOUND_FETCH_FAILED');
                    res.status(500).end();
                }
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/playSound') //TODO: serverId as path parameter
        .post(async (req, res) => {
            try {
                const result = getPayload(res);
                const status = await discordBot.isUserInServer(result.id, req.body.serverId);
                if (!status) {
                    notInServer(res, result.id, req.body.serverId, req);
                    return;
                }
                req.body.volume = Math.abs(req.body.volume); //negative values should not be possible
                if (!discordBot.isSuperAdmin(result.id) && req.body.volume > 1) {
                    req.body.volume = 1;
                }

                const channelId = await discordBot.getChannelIdThroughUser(req.body.joinUser, req.body.serverId, req.body.channelId, result.id);
                if (!channelId) {
                    res.statusMessage = getResponseMessage(req, 'USER_NOT_IN_VOICE_CHANNEL');
                    res.status(400).end();
                    return;
                }
                if (req.body.soundId) {
                    const meta = await databaseHelper.getSoundMeta(req.body.soundId);
                    if (!meta) {
                        res.statusMessage = getResponseMessage(req, 'SOUND_NOT_FOUND');
                        res.status(404).end();
                        return;
                    }
                    void databaseHelper.logPlaySound(result.id, meta);
                    const forcePlay = req.body.forcePlay && await discordBot.isUserAdminInServer(result.id, req.body.serverId);

                    await requestSound(meta.path, req.body.serverId, channelId, req.body.volume, forcePlay);
                    res.statusMessage = getResponseMessage(req, 'SOUND_PLAY_TRIGGERED');
                    res.status(200).end();
                } else if (req.body.url) {
                    await playSound(req.body.serverId, channelId, undefined, req.body.volume, req.body.url);
                    res.statusMessage = getResponseMessage(req, 'SOUND_PLAY_TRIGGERED');
                    res.status(200).end();
                }
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/deleteSound/:id')
        .delete(async (req, res) => {
            try {
                const result = getPayload(res);
                const meta = await databaseHelper.getSoundMeta(req.params.id);
                if (meta && (meta.userId === result.id || discordBot.isSuperAdmin(result.id))) {
                    try {
                        await dataService.deleteSound(meta, result.id);

                        res.statusMessage = getResponseMessage(req, 'SOUND_DELETED');
                        res.status(200).end();
                    } catch {
                        res.statusMessage = getResponseMessage(req, 'SOUND_DELETE_ERROR');
                        res.status(500).end();
                    }
                } else {
                    res.statusMessage = getResponseMessage(req, 'SOUND_NOT_FOUND');
                    res.status(404).end();
                }
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/channels/:serverId')
        .get(async (req, res) => {
            try {
                const result = getPayload(res);
                const status = await discordBot.isUserInServer(result.id, req.params.serverId);
                if (status) {
                    const channels = await discordBot.getVoiceChannelsOfServer(req.params.serverId);
                    res.status(200).json(channels);
                } else {
                    notInServer(res, result.id, req.params.serverId, req);
                }
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/soundCategories/:serverId')
        .get(async (req, res) => {
            try {
                const serverId = req.params.serverId;
                const result = getPayload(res);
                if (await discordBot.isUserInServer(result.id, serverId)) {
                    res.status(200).json(await databaseHelper.getSoundCategories(serverId));
                    return;
                }
                res.status(403).json();
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/uploadFile')
        .post(upload.array('files'), async (req, res) => {
            try {
                if (!req.files) {
                    return;
                }
                const result = getPayload(res);
                const status = await discordBot.isUserInServer(result.id, req.body.serverId);
                if (status) {
                    try {
                        await databaseHelper.addSoundsMeta(req.files, result.id, req.body.category, req.body.serverId);
                        res.statusMessage = getResponseMessage(req, 'SOUND_UPLOADED');
                        res.status(200).end();
                    } catch (e) {
                        logger.error(e as Error, 'addSoundMeta');
                    }
                } else {
                    try {
                        await fileHelper.deleteFiles(req.files);
                        notAdmin(res, req);
                    } catch (error) {
                        logger.error(error as Error, `DeleteFiles not possible.\nFiles: ${fileHelper.getFiles(req.files).join('\n')}`);
                        notInServer(res, result.id, req.body.serverId, req);
                    }
                }
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });


    router.route('/userIntro')
        .post(async (req, res) => {
            try {
                const result = getPayload(res);
                const meta = await databaseHelper.getSoundMeta(req.body.soundId);
                const soundId: ObjectId | string | undefined = meta?._id ?? req.body.soundId;
                let id: string;
                let isAllowed: boolean;
                let isAdmin = false;

                if (req.body.userId) {
                    isAdmin = isAllowed = await discordBot.isUserAdminWhereAnotherUser(result.id, req.body.userId, req.body.serverId);
                    id = isAllowed ? req.body.userId : result.id;
                } else {
                    isAllowed = await discordBot.isUserInServer(result.id, req.body.serverId);
                    id = result.id;
                }

                if (isAllowed && (!meta || meta.serverId === req.body.serverId)) {
                    try {
                        await databaseHelper.setIntro(id, soundId, req.body.serverId, !isAdmin);
                        res.statusMessage = getResponseMessage(req, 'USER_INTRO_SET');
                        res.status(200).end();
                    } catch {
                        res.statusMessage = getCommandLangKey(getRequestBaseLocale(req), CommandLangKey.ERRORS_INTRO_TOO_LONG);
                        res.status(400).end();
                    }
                } else {
                    res.status(500).end();
                }
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/userIntro/:serverId')
        .get(async (req, res) => {
            try {
                const result = getPayload(res);
                const intro = await databaseHelper.getIntro(result.id, req.params.serverId);
                res.status(200).json(intro);
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/hasAdminServers')
        .get(async (req, res) => {
            try {
                const result = getPayload(res);
                const status = await discordBot.hasUserAdminServers(result.id);
                res.status(200).json(status);
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });

    router.route('/users/:serverId')
        .get(async (req, res) => {
            try {
                const serverId = req.params.serverId;
                const result = getPayload(res);
                let users: GuildMember[];
                if (discordBot.isSuperAdmin(result.id)) {
                    users = await discordBot.getUsers(serverId);
                } else {
                    users = await discordBot.getUsersWhereIsAdmin(result.id, serverId);
                }
                const userInfo = await databaseHelper.getUsersInfo(users.map((user) => user.id), serverId);
                await discordBot.mapUsernames(userInfo, 'id');
                res.status(200).json(userInfo);
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });
}

function notInServer(res: Response, userId: string, serverId: string, req: Request) {
    logger.warn('User not in server', { userId, serverId });
    res.statusMessage = getResponseMessage(req, 'NOT_IN_SERVER');
    res.status(403).end();
}

function notAdmin(res: Response, req: Request) {
    res.statusMessage = getResponseMessage(req, 'NOT_ADMIN');
    res.status(403).end();
}

function getPayload(res: Response): IUserPayload {
    return res.locals.payload;
}

function defaultError(e: Error, res: Response, req: Request): void {
    logger.error(e as Error, ErrorTypes.DEFAULT_ERROR);
    res.statusMessage = getResponseMessage(req, 'DEFAULT_ERROR');
    res.status(500);
}
