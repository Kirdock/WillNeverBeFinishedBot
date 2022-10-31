import multer from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileHelper } from '../services/fileHelper';
import { Request, Response, Router as rs } from 'express';
import { DiscordBot } from '../discordServer/DiscordBot';
import { DatabaseHelper } from '../services/databaseHelper';
import { AuthHelper } from '../services/authHelper';
import { ErrorTypes } from '../services/ErrorTypes';
import { GuildMember } from 'discord.js';
import { AudioExportType } from '../../../shared/models/types';
import { logger } from '../services/logHelper';
import { IServerSettings } from '../../../shared/interfaces/server-settings';
import { ILog } from '../interfaces/log';
import { getResponseMessage } from '../services/localeService';
import { IResponseMessages } from '../interfaces/response-messages';
import { IUserPayload } from '../interfaces/user-payload';
import { IUserVoiceSettings } from '../../../shared/interfaces/user-voice-settings';
import { createUserVoiceSetting } from '../utils/User';

export function registerRoutes(discordBot: DiscordBot, router: rs, databaseHelper: DatabaseHelper, authHelper: AuthHelper) {
    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, FileHelper.soundFolder)
        },
        filename: (_req, file, cb) => {
            cb(null, `${uuidv4()}${extname(file.originalname)}`)
        }
    });
    const upload = multer({storage});

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
            })
        } catch (e) {
            defaultError(e as Error, res, req);
        }
    })

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
                const connection = discordBot.voiceHelper.getActiveConnection(settings.id);
                if (connection) {
                    if (settings.recordVoice) {
                        discordBot.voiceHelper.recordHelper.startRecording(connection);
                    } else {
                        discordBot.voiceHelper.recordHelper.stopRecording(connection);
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
                const valid = discordBot.isSuperAdmin(result.id) || await discordBot.isUserAdminInServer(result.id, req.params.serverId)
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
                    await discordBot.playSoundCommand.stopPlaying(req.params.serverId, isAdmin);
                    res.statusMessage = getResponseMessage(req, 'SOUND_PLAY_STOPPED');
                    res.status(200).end();
                } catch (error) {
                    const message = (error as Error).message;
                    res.statusMessage = getResponseMessage(req, errorToResponseMessageKey(message));
                    res.status(500).end();

                    function errorToResponseMessageKey(message: string): keyof IResponseMessages {
                        if (message === ErrorTypes.SERVER_ID_NOT_FOUND) {
                            return 'SERVER_NOT_FOUND';
                        }
                        if (message === ErrorTypes.PLAY_NOT_ALLOWED) {
                            return 'SOUND_PLAY_NOT_ALLOWED';
                        }
                        return 'DEFAULT_ERROR'
                    }
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

    router.route('voiceRecorder/server/:serverId/userSettings')
        .get(async (req: Request, res: Response) => {
            try {
                const result = getPayload(res);
                const serverId = req.params.serverId;
                if (!(await discordBot.isUserAdminInServer(result.id, serverId))) {
                    res.statusMessage = getResponseMessage(req, 'NOT_ADMIN');
                    res.status(404).end();
                    return;
                }
                const userSettings = await databaseHelper.getUsersRecordVolume(serverId);

                await discordBot.addMissingUsers(userSettings, serverId, createUserVoiceSetting);
                await discordBot.mapUsernames(userSettings, 'id');
                res.json(userSettings as IUserVoiceSettings[]);
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        })

    router.route('voiceRecorder/server/:serverId/userSettings/user/:userId')
        .get(async (req: Request, res: Response) => {
            try {
                const result = getPayload(res);
                const {serverId, userId} = req.params;
                const volume = +req.body.volume;
                if (!(await discordBot.isUserAdminInServer(result.id, serverId))) {
                    res.statusMessage = getResponseMessage(req, 'NOT_ADMIN');
                    res.status(404).end();
                    return;
                }
                if (!volume || isNaN(volume)) {
                    res.status(400).end();
                    return;
                }
                await databaseHelper.updateUserRecordVolume(serverId, userId, volume);
                res.status(200).end();
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        })

    router.route('/recordVoice/:serverId')
        .get(async (req: Request, res: Response) => {
            try {
                const result = getPayload(res);
                const {serverId} = req.params;

                if (!(await discordBot.isUserInServer(result.id, serverId))) {
                    res.statusMessage = getResponseMessage(req, 'SERVER_NOT_FOUND');
                    res.status(404).end();
                    return;
                }
                const serverSettings = await databaseHelper.getServerSettings(serverId);
                const exportType = req.query.recordType?.toString() as AudioExportType | undefined;
                const fileName = new Date().toISOString().split('.')[0].replace(/:/g, '-').replace(/T/g, ' ');
                if (exportType === 'audio') {
                    res.type('audio/mp3').attachment(`${fileName}.mp3`);

                } else {
                    res.type('application/zip').attachment(`${fileName}-all-streams.zip`);
                }
                const succeeded = await discordBot.voiceHelper.recordHelper.getRecordedVoice(serverId, exportType, req.query.minutes ? +(req.query.minutes.toString()) : undefined, serverSettings, res);

                if (!succeeded) {
                    res.statusMessage = getResponseMessage(req, 'RECORDING_NOT_FOUND');
                    res.status(404).end();
                    return;
                }
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        })

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
                    const result = soundMetas.map(meta => {
                        const {path, ...data} = meta;
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
                    databaseHelper.logPlaySound(result.id, meta);
                    const forcePlay = req.body.forcePlay && await discordBot.isUserAdminInServer(result.id, req.body.serverId);

                    await discordBot.playSoundCommand.requestSound(meta.path, req.body.serverId, channelId, req.body.volume, forcePlay);
                    res.statusMessage = getResponseMessage(req, 'SOUND_PLAY_TRIGGERED');
                    res.status(200).end();
                } else if (req.body.url) {
                    await discordBot.playSoundCommand.playSound(req.body.serverId, channelId, undefined, req.body.volume, req.body.url);
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
                    const filePath = meta.path;
                    await databaseHelper.removeSoundMeta(req.params.id);
                    try {
                        await FileHelper.deleteFile(filePath);
                        await databaseHelper.logSoundDelete(result.id, meta);
                        res.statusMessage = getResponseMessage(req, 'SOUND_DELETED');
                        res.status(200).end();
                    } catch (error) {
                        logger.error(error as Error, 'DeleteFile');
                        try {
                            await databaseHelper.addSoundMeta(meta._id, meta.path, meta.fileName, meta.userId, meta.category, meta.serverId);
                        } catch (error2) {
                            logger.error(error2 as Error, 'AddSoundMeta');
                        }
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

    router.route('/soundCategories')
        .get(async (req, res) => {
            try {
                res.status(200).json(await databaseHelper.getSoundCategories());
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
                        await FileHelper.deleteFiles(req.files);
                        notAdmin(res, req);
                    } catch (error) {
                        logger.error(error as Error, `DeleteFiles not possible.\nFiles: ${FileHelper.getFiles(req.files).join('\n')}`);
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
                const soundId = meta?._id ?? req.body.soundId;
                let id: string;
                let isAllowed: boolean;

                if (req.body.userId) {
                    isAllowed = await discordBot.isUserAdminWhereAnotherUser(result.id, req.body.userId, req.body.serverId);
                    id = isAllowed ? req.body.userId : result.id;
                } else {
                    isAllowed = await discordBot.isUserInServer(result.id, req.body.serverId);
                    id = result.id;
                }

                if (isAllowed && (!meta || meta.serverId === req.body.serverId)) {
                    await databaseHelper.setIntro(id, soundId, req.body.serverId);
                    res.statusMessage = getResponseMessage(req, 'USER_INTRO_SET');
                    res.status(200).end();
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
                const userInfo = await databaseHelper.getUsersInfo(users.map(user => user.id), serverId);
                await discordBot.mapUsernames(userInfo, 'id');
                res.status(200).json(userInfo);
            } catch (e) {
                defaultError(e as Error, res, req);
            }
        });
}

function notInServer(res: Response, userId: string, serverId: string, req: Request) {
    logger.warn('User not in server', {userId, serverId});
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
