import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import FileHelper from '../services/fileHelper';
import { Router as rs } from 'express';
import Logger from '../services/logger';
import { DiscordBot } from '../discordServer/DiscordBot';
import { DatabaseHelper } from '../services/databaseHelper';
import AuthHelper from '../services/authHelper';
import { UserPayload } from '../models/UserPayload';
import { Request, Response } from 'express';
import { ErrorTypes } from '../services/ErrorTypes';
import { SoundMeta } from '../models/SoundMeta';

export class Router {
  constructor(discordBot: DiscordBot, router: rs, fileHelper: FileHelper, databaseHelper: DatabaseHelper, private logger: Logger, authHelper: AuthHelper) {

    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, fileHelper.soundFolder)
      },
      filename: (_req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname))
      }
    });
    const upload = multer({ storage });


    router.route('/login')
      .post(async (req, res) => {
        try {
          const authToken = await authHelper.login(req.body.code, req.body.redirectUrl);
          res.status(200).json(authToken);
        }
        catch (error) {
          this.logger.error(error, 'Login');
          res.status(401).json({ message: 'Authentication failed' });
        }
      });

    router.route('/log/:serverId/:pageSize/:pageKey') // TO-DO: add parameter for serverId
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        if (await discordBot.isUserAdminInServer(result.id, req.params.serverId)) {
          res.status(200).json(await databaseHelper.getLogs(req.params.serverId, +req.params.pageSize, +req.params.pageKey));
        }
        else {
          this.notAdmin(res);
        }
      });

    router.route('/servers')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        const servers = await discordBot.getUserServers(result.id);
        res.status(200).json(servers);
      });

    router.route('/serverInfo')
      .post(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        if (discordBot.isSuperAdmin(result.id)) {
          databaseHelper.udpateServerInfo(req.body.serverInfo)
          res.status(200).json();
        } else {
          const guild = await discordBot.isUserAdminInServer(result.id, req.body.serverInfo.id);
          if (guild) {
            databaseHelper.udpateServerInfo(req.body.serverInfo)
            res.status(200).json();
          }
          else {
            this.notAdmin(res);
          }
        }
      });

    router.route('/stopPlaying/:serverId')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        const status: boolean = await discordBot.isUserInServer(result.id, req.params.serverId);
        if (status) {
          const isAdmin: boolean = await discordBot.isUserAdminInServer(result.id, req.params.serverId) || discordBot.isSuperAdmin(result.id);
          try {
            await discordBot.playSoundCommand.stopPlaying(req.params.serverId, isAdmin);
            res.status(200).json();
          }
          catch (error) {
            res.status(500).json(error);
          }
        }
        else {
          this.notInServer(res, result.id, req.params.serverId);
        }
      });

    router.route('/sounds')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        const servers = await discordBot.getUserServers(result.id);
        res.status(200).json(databaseHelper.getSoundsMeta(servers));
      });

    router.route('/sound/:soundId')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        const meta = await databaseHelper.getSoundMeta(+req.params.soundId);
        let status = false;
        if (meta) {
          status = await discordBot.isUserInServer(result.id, meta.serverId);
        }

        if (status) {
          res.status(200).download(meta.path, meta.fileName + path.extname(meta.path));
        } else {
          res.status(404).json();
        }
      });

    router.route('/sounds/:serverId')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        const status = await discordBot.isUserInServer(result.id, req.params.serverId);
        if (status) {
          res.status(200).json(databaseHelper.getSoundsMeta([{ id: req.params.serverId }]));
        } else {
          this.notInServer(res, result.id, req.params.serverId);
        }
      });

    router.route('/playSound')
      .post(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        const status = discordBot.isUserInServer(result.id, req.body.serverId);
        if (status) {
          req.body.volume = Math.abs(req.body.volume); //negative values should not be possible
          if (!discordBot.isSuperAdmin(result.id) && req.body.volume >= 1) {
            req.body.volume = 1;
          }

          const guild = await discordBot.getServer(req.body.serverId);
          const channelId = await discordBot.getChannelIdThroughUser(req.body.joinUser, req.body.serverId, req.body.channelId, guild, result.id);
          try {
            if (!channelId) throw ErrorTypes.USER_NOT_IN_VOICE_CHANNEL;

            if (req.body.soundId) {
              const meta = await databaseHelper.getSoundMeta(req.body.soundId);
              if (meta) {
                databaseHelper.logPlaySound(result.id, guild.id, guild.name, meta);
                let forcePlay = false;
                if (req.body.forcePlay) {
                  forcePlay = await discordBot.isUserAdminInServer(result.id, req.body.serverId)
                }
                await discordBot.playSoundCommand.requestSound(meta.path, req.body.serverId, channelId, req.body.volume, forcePlay);
                res.status(200).json();
              }
              else {
                res.status(404).json();
              }
            }
            else if (req.body.url) {
              await discordBot.playSoundCommand.playSound(req.body.serverId, channelId, undefined, req.body.volume, req.body.url);
              res.status(200).json();
            }
          }
          catch (error) {
            this.logger.error(error, 'requestSound');
            res.status(404).json(error);
          }
        }
        else {
          this.notInServer(res, result.id, req.body.serverId);
        }
      });

    router.route('/deleteSound/:id')
      .delete(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        const meta = await databaseHelper.getSoundMeta(+req.params.id);
        if (meta?.userId === result.id || discordBot.isSuperAdmin(result.id)) {
          const filePath = meta.path;
          await databaseHelper.removeSoundMeta(+req.params.id, await discordBot.getServerName(meta.serverId));
          try {
            await fileHelper.deleteFile(filePath);
            res.status(200).json();
          }
          catch (error) {
            this.logger.error(error, 'DeleteFile');
            try {
              await databaseHelper.addSoundMeta(meta.id, meta.path, meta.fileName, meta.userId, meta.category, meta.serverId);
            }
            catch {
              this.logger.error(error, 'AddSoundMeta');
            }
            res.status(500).json();
          }
        }
        else {
          res.status(403).json();
        }
      });

    router.route('/channels/:serverId')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        const status = await discordBot.isUserInServer(result.id, req.params.serverId);
        if (status) {
          const channels = await discordBot.getVoiceChannelsOfServer(req.params.serverId);
          res.status(200).json(channels);
        }
        else {
          this.notInServer(res, result.id, req.params.serverId);
        };
      });

    router.route('/soundCategories')
      .get(async (req, res) => {
        res.status(200).json(await databaseHelper.getSoundCategories());
      });

    router.route('/uploadFile')
      .put(upload.array('files'), async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        const status = await discordBot.isUserInServer(result.id, req.body.serverId);
        if (status) {
          let addedFiles = databaseHelper.addSoundsMeta(req.files, result.id, req.body.category, req.body.serverId);
          res.status(200).json(addedFiles);
        } else {
          try {
            await fileHelper.deleteFiles(req.files);
            this.notAdmin(res);
          }
          catch (error) {
            this.logger.error(error, `DeleteFiles not possible.\nFiles: ${fileHelper.getFileNames(req.files).join('\n')}`);
            this.notInServer(res, result.id, req.body.serverId);
          }
        }
      });

    router.route('/setIntro')
      .post(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        const meta: SoundMeta = await databaseHelper.getSoundMeta(req.body.soundId);
        const soundId = meta?.id ?? +req.body.soundId;
        let id: string;
        let isAllowed: boolean = false;

        if (req.body.userId) {
          isAllowed = await discordBot.isUserAdminWhereAnotherUser(result.id, req.body.userId, req.body.serverId);
          id = isAllowed ? req.body.userId : result.id;
        } else {
          isAllowed = await discordBot.isUserInServer(result.id, req.body.serverId);
          id = result.id;
        }

        if (isAllowed && (!meta || meta.serverId === req.body.serverId)) {
          databaseHelper.setIntro(id, soundId, req.body.serverId);
          res.status(200).json();
        }
        else {
          res.status(500).json();
        }
      });

    router.route('/user/:serverId')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        const user = await discordBot.getUser(result.id);
        res.status(200).json(databaseHelper.getUserInfo(user, req.params.serverId));
      });

    router.route('/hasAdminServers')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        const status = await discordBot.hasUserAdminServers(result.id);
        res.status(200).json(status);
      });

    router.route('/users/:serverId')
      .get(async (req, res) => {
        const result: UserPayload = this.getPayload(req);
        if (discordBot.isSuperAdmin(result.id)) {
          const users = await discordBot.getUsers(req.params.serverId);
          res.status(200).json(databaseHelper.getUsersInfo(users, req.params.serverId));
        }
        else {
          const users = await discordBot.getUsersWhereIsAdmin(result.id);
          if (users) {
            res.status(200).json(databaseHelper.getUsersInfo(users, req.params.serverId));
          }
          else {
            res.status(200).json([]);
          }
        }
      });
  }

  private notInServer(res: Response, userId: string, serverId: string) {
    this.logger.warn({ userId, serverId }, 'User not in server');
    res.status(403).json({ message: 'Du host auf den Server kan Zugriff!!' });
  }

  private notAdmin(res: Response) {
    res.status(403).json({ message: 'Nur der Hochadel hat Zugriff auf diese Funktion' });
  }

  private getPayload(req: Request): UserPayload {
    return req.body.payload;
  }
}