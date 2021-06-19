import multer from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileHelper } from '../services/fileHelper';
import { Router as rs } from 'express';
import { Logger } from '../services/logger';
import { DiscordBot } from '../discordServer/DiscordBot';
import { DatabaseHelper } from '../services/databaseHelper';
import { AuthHelper } from '../services/authHelper';
import { UserPayload } from '../models/UserPayload';
import { Response } from 'express';
import { ErrorTypes } from '../services/ErrorTypes';
import { SoundMeta } from '../models/SoundMeta';
import { GuildMember } from 'discord.js';
import { Log } from '../models/Log';

export class Router {
  constructor(discordBot: DiscordBot, router: rs, fileHelper: FileHelper, databaseHelper: DatabaseHelper, private logger: Logger, authHelper: AuthHelper) {

    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, fileHelper.soundFolder)
      },
      filename: (_req, file, cb) => {
        cb(null, `${uuidv4()}${extname(file.originalname)}`)
      }
    });
    const upload = multer({ storage });


    router.route('/login')
      .post(async (req, res) => {
        try {
          const authToken = await authHelper.login(req.body.code, req);
          res.status(200).send(authToken);
        }
        catch (error) {
          this.logger.error(error, 'Login');
          res.statusMessage = ErrorTypes.LOGIN_FAILED;
          res.status(400).end();
        }
      });

    router.route('/logs/:serverId')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(res);
        if (discordBot.isSuperAdmin(result.id) || await discordBot.isUserAdminInServer(result.id, req.params.serverId)) {
          const logs: Log[] = await databaseHelper.getLogs(req.params.serverId, +(req.query.pageSize as string), +(req.query.pageKey as string), +(req.query.fromTime as string));
          await discordBot.mapUsernames(logs, 'userId');
          res.status(200).json(logs);
        }
        else {
          this.notAdmin(res);
        }
      });

    router.route('/servers')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(res);
        const servers = await discordBot.getUserServers(result.id);
        res.status(200).json(servers);
      });

    router.route('/serverSettings')
      .post(async (req, res) => {
        const result: UserPayload = this.getPayload(res);
        const valid = discordBot.isSuperAdmin(result.id) || await discordBot.isUserAdminInServer(result.id, req.body.serverSettings.id);
        if (valid) {
          await databaseHelper.udpateServerSettings(req.body.serverSettings);
          res.statusMessage = 'Einstöllungen sen aufm neiestn Stond';
          res.status(200).end();
        } else {
          this.notAdmin(res);
        }
      });

    router.route('/serverSettings/:serverId')
    .get(async (req, res) => {
      const result: UserPayload = this.getPayload(res);
      const valid = discordBot.isSuperAdmin(result.id) || await discordBot.isUserAdminInServer(result.id, req.params.serverId)
      if (valid) {
        res.status(200).json(await databaseHelper.getServerSettings(req.params.serverId));
      }
      else {
        this.notAdmin(res);
      }
    });
      
    router.route('/stopPlaying/:serverId')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(res);
        const status: boolean = await discordBot.isUserInServer(result.id, req.params.serverId);
        if (status) {
          const isAdmin: boolean = await discordBot.isUserAdminInServer(result.id, req.params.serverId) || discordBot.isSuperAdmin(result.id);
          try {
            await discordBot.playSoundCommand.stopPlaying(req.params.serverId, isAdmin);
            res.statusMessage = 'Da Bot holtat jetz de Goschn';
            res.status(200).end();
          }
          catch (error) {
            res.statusMessage = error;
            res.status(500).end();
          }
        }
        else {
          this.notInServer(res, result.id, req.params.serverId);
        }
      });

    router.route('/sound/:soundId')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(res);
        const meta: SoundMeta | undefined = await databaseHelper.getSoundMeta(req.params.soundId);
        
        if (meta && await discordBot.isUserInServer(result.id, meta.serverId)) {
          res.status(200).download(meta.path, meta.fileName + extname(meta.path));
        }
        else {
          res.statusMessage = ErrorTypes.SOUND_NOT_FOUND;
          res.status(404).end();
        }
      });

    router.route('/sounds/:serverId')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(res);
        const status = await discordBot.isUserInServer(result.id, req.params.serverId);
        if (status) {
          const soundMetas = await databaseHelper.getSoundsMeta([req.params.serverId], +(req.query.fromTime as string));
          try{
            await discordBot.mapUsernames(soundMetas, 'userId');
            const result = soundMetas.map(meta => {
              const {path, ...data} = meta;
              return data;
            });
            res.status(200).json(result);
          }
          catch (error) {
            this.logger.error(error, 'Fetching user failed');
            res.statusMessage = 'Konn de Sounds nit lodn. Frog Mr. Admin wos do vakehrt laft';
            res.status(500).end();
          }
        } else {
          this.notInServer(res, result.id, req.params.serverId);
        }
      });

    router.route('/playSound')
      .post(async (req, res) => {
        const result: UserPayload = this.getPayload(res);
        const status = await discordBot.isUserInServer(result.id, req.body.serverId);
        if (status) {
          req.body.volume = Math.abs(req.body.volume); //negative values should not be possible
          if (!discordBot.isSuperAdmin(result.id) && req.body.volume > 1) {
            req.body.volume = 1;
          }

          const channelId = await discordBot.getChannelIdThroughUser(req.body.joinUser, req.body.serverId, req.body.channelId, result.id);
          if (channelId) {
            if (req.body.soundId) {
              const meta = await databaseHelper.getSoundMeta(req.body.soundId);
              if (meta) {
                databaseHelper.logPlaySound(result.id, meta);
                const forcePlay = req.body.forcePlay ? await discordBot.isUserAdminInServer(result.id, req.body.serverId) : false;

                await discordBot.playSoundCommand.requestSound(meta.path, req.body.serverId, channelId, req.body.volume, forcePlay);
                res.statusMessage = 'Sound sollt jetzt obgspült werdn';
                res.status(200).end();
              }
              else {
                res.statusMessage = ErrorTypes.SOUND_NOT_FOUND;
                res.status(404).end();
              }
            }
            else if (req.body.url) {
              await discordBot.playSoundCommand.playSound(req.body.serverId, channelId, undefined, req.body.volume, req.body.url);
              res.statusMessage = 'Sound sollt jetzt obgspült werdn';
              res.status(200).end();
            }
          }
          else {
            res.statusMessage = ErrorTypes.USER_NOT_IN_VOICE_CHANNEL;
            res.status(400).end();
          }
        }
        else {
          this.notInServer(res, result.id, req.body.serverId);
        }
      });

    router.route('/deleteSound/:id')
      .delete(async (req, res) => {
        const result: UserPayload = this.getPayload(res);
        const meta = await databaseHelper.getSoundMeta(req.params.id);
        if (meta && (meta.userId === result.id || discordBot.isSuperAdmin(result.id))) {
          const filePath = meta.path;
          await databaseHelper.removeSoundMeta(req.params.id);
          try {
            await fileHelper.deleteFile(filePath);
            await databaseHelper.logSoundDelete(result.id, meta);
            res.statusMessage = 'Datei wurde eliminiert';
            res.status(200).end();
          }
          catch (error) {
            this.logger.error(error, 'DeleteFile');
            try {
              await databaseHelper.addSoundMeta(meta._id, meta.path, meta.fileName, meta.userId, meta.category, meta.serverId);
            }
            catch {
              this.logger.error(error, 'AddSoundMeta');
            }
            res.statusMessage = ErrorTypes.SOUND_COULD_NOT_BE_DELETED;
            res.status(500).end();
          }
        }
        else {
          res.statusMessage = ErrorTypes.SOUND_NOT_FOUND;
          res.status(404).end();
        }
      });

    router.route('/channels/:serverId')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(res);
        const status = await discordBot.isUserInServer(result.id, req.params.serverId);
        if (status) {
          const channels = await discordBot.getVoiceChannelsOfServer(req.params.serverId);
          res.status(200).json(channels);
        }
        else {
          this.notInServer(res, result.id, req.params.serverId);
        }
      });

    router.route('/soundCategories')
      .get(async (req, res) => {
        res.status(200).json(await databaseHelper.getSoundCategories());
      });

    router.route('/uploadFile')
      .post(upload.array('files'), async (req, res) =>  {
        const result: UserPayload = this.getPayload(res);
        const status = await discordBot.isUserInServer(result.id, req.body.serverId);
          if (status) {
            try{
              await databaseHelper.addSoundsMeta(req.files, result.id, req.body.category, req.body.serverId);
              res.statusMessage = 'Gratuliere! Du hosts gschofft a Datei hochzulodn :thumbsup:';
              res.status(200).end();
            }
            catch(e) {
              this.logger.error(e, 'addSoundMeta');
            }
          } else {
            try {
              await fileHelper.deleteFiles(req.files);
              this.notAdmin(res);
            }
            catch (error) {
              this.logger.error(error, `DeleteFiles not possible.\nFiles: ${fileHelper.getFiles(req.files).join('\n')}`);
              this.notInServer(res, result.id, req.body.serverId);
            }
          }
        });
          

    router.route('/userIntro')
      .post(async (req, res) => {
        const result: UserPayload = this.getPayload(res);
        const meta: SoundMeta | undefined = await databaseHelper.getSoundMeta(req.body.soundId);
        const soundId = meta?._id ?? req.body.soundId;
        let id: string;
        let isAllowed = false;

        if (req.body.userId) {
          isAllowed = await discordBot.isUserAdminWhereAnotherUser(result.id, req.body.userId, req.body.serverId);
          id = isAllowed ? req.body.userId : result.id;
        } else {
          isAllowed = await discordBot.isUserInServer(result.id, req.body.serverId);
          id = result.id;
        }

        if (isAllowed && (!meta || meta.serverId === req.body.serverId)) {
          databaseHelper.setIntro(id, soundId, req.body.serverId);
          res.statusMessage = 'Dei Untergong is gsetzt wordn';
          res.status(200).end();
        }
        else {
          res.status(500).end();
        }
      });

    router.route('/userIntro/:serverId')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(res);
        const intro = await databaseHelper.getIntro(result.id, req.params.serverId);
        res.status(200).json(intro);
      });

    router.route('/hasAdminServers')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(res);
        const status = await discordBot.hasUserAdminServers(result.id);
        res.status(200).json(status);
      });

    router.route('/users/:serverId')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(res);
        let users: GuildMember[];
        if (discordBot.isSuperAdmin(result.id)) {
          users = await discordBot.getUsers(req.params.serverId);
        } else {
          users = await discordBot.getUsersWhereIsAdmin(result.id, req.params.serverId);
        }
        const userInfo = await databaseHelper.getUsersInfo(users.map(user => user.id), req.params.serverId);
        await discordBot.mapUsernames(userInfo, 'id');
        res.status(200).json(userInfo);
      });
  }

  private notInServer(res: Response, userId: string, serverId: string) {
    this.logger.warn({ userId, serverId }, 'User not in server');
    res.statusMessage = 'Du host auf den Server kan Zugriff!!';
    res.status(403).end();
  }

  private notAdmin(res: Response) {
    res.statusMessage = 'Nur der Hochadel hat Zugriff auf diese Funktion';
    res.status(403).end();
  }

  private getPayload(res: Response): UserPayload {
    return res.locals.payload;
  }
}