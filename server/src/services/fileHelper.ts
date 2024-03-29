import { existsSync, mkdirSync, readFileSync } from 'fs';
import { basename, extname, join } from 'path';
import ffmpeg, { ffprobe } from 'fluent-ffmpeg';
import { rename, unlink } from 'fs/promises';
import { EnvironmentConfig } from './config';
import { scopedLogger } from './logHelper';
import type { Readable } from 'stream';
import { PassThrough } from 'stream';
import { v4 as uuidv4 } from 'uuid';

const logger = scopedLogger('FILE_SYSTEM');

class FileHelper {
    public readonly rootDir: string = EnvironmentConfig.ROOT_DIR || join(__dirname, '/../../../');
    private readonly baseDir: string = join(this.rootDir, 'server', 'shared');
    public readonly soundFolder: string = join(this.baseDir, 'sounds');
    public readonly certFolder: string = join(this.baseDir, 'cert');
    private readonly workFolder: string = join(this.soundFolder, 'work');

    constructor() {
        this.checkAndCreateFolderSystem();
    }


    private checkAndCreateFolderSystem() {
        for (const folder of [this.baseDir, this.soundFolder, this.workFolder]) {
            this.checkAndCreateFolder(folder);
        }
    }

    private checkAndCreateFolder(folder: string): void {
        if (!existsSync(folder)) {
            mkdirSync(folder);
        }
    }

    public existsFile(path: string): boolean {
        return existsSync(path);
    }

    public async deleteFile(path: string): Promise<boolean> {
        let deleted = false;
        if (this.existsFile(path)) {
            try {
                await unlink(path);
                deleted = true;
            } catch (e) {
                logger.error(e as Error, { path });
            }
        }

        return deleted;
    }

    public async deleteFiles(fileArray: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[]): Promise<boolean> {
        let status = true;
        const files: Express.Multer.File[] = this.getFiles(fileArray);

        for await (const file of files) {
            const stat = await this.deleteFile(file.path);
            status &&= stat;
        }
        return status;
    }

    public getFiles(fileArray: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[]): Express.Multer.File[] {
        let files: Express.Multer.File[] = [];
        if (fileArray instanceof Array) {
            files = fileArray as Express.Multer.File[];
        } else {
            fileArray = fileArray as { [fieldname: string]: Express.Multer.File[]; };
            for (const key in fileArray) {
                files.push(...fileArray[key]);
            }
        }
        return files;
    }

    public getFileName(filePath: string): string {
        return basename(filePath, extname(filePath));
    }

    public readFile(filePath: string): Buffer {
        return readFileSync(filePath);
    }

    public async normalizeFiles(files: Express.Multer.File[]): Promise<void> {
        for (const file of files) {
            await this.normalizeFile(file);
        }
    }

    public async normalizeFile(file: Express.Multer.File): Promise<boolean> {
        return await new Promise((resolve) => {
            const newFileName = this.getFileName(file.filename) + '.mp3';
            const tempPath = join(this.workFolder, newFileName);
            ffmpeg(file.path)
                .audioFilter('loudnorm')
                .on('error', (e) => {
                    logger.error(e, 'Normalize files');
                    resolve(e);
                })
                .on('end', async () => {
                    try {
                        const newPath = join(file.destination, newFileName);
                        await unlink(file.path);
                        await rename(tempPath, newPath);
                        file.path = newPath;
                    } catch {
                        await this.deleteFile(tempPath);
                    }
                    resolve(true);
                })
                .save(tempPath);
        });
    }

    public async normalizeStreamAndSave(file: Readable, path: string): Promise<boolean> {
        return await new Promise((resolve) => {
            ffmpeg(file)
                .audioFilter('loudnorm')
                .on('error', (e) => {
                    logger.error(e, 'Normalize files');
                    resolve(e);
                })
                .on('end', async () => {
                    resolve(true);
                })
                .save(path);
        });
    }

    public async normalizeStream(stream: Readable): Promise<PassThrough> {
        const passThrough = new PassThrough();
        await new Promise((resolve) => {
            ffmpeg(stream)
                .audioFilter('loudnorm')
                .on('error', (e) => {
                    logger.error(e, 'Normalize files');
                    resolve(e);
                })
                .on('end', async () => {
                    resolve(true);
                })
                .writeToStream(passThrough);
        });
        return passThrough;
    }

    public generateSoundPath(fileName: string): string {
        return join(this.soundFolder, fileName);
    }

    public generateUniqueFileName(fileName: string): string {
        return `${uuidv4()}${extname(fileName)}`;
    }

    public async getFileDuration(filePath: string): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            ffprobe(filePath, (err, data) => {
                if (err || data.format.duration === undefined) {
                    reject(err);
                    return;
                }
                resolve(data.format.duration);
            });
        });
    }
}

export const fileHelper = new FileHelper();
