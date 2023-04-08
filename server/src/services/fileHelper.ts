import { existsSync, mkdirSync, readFileSync } from 'fs';
import { basename, extname, join } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { rename, unlink } from 'fs/promises';
import { EnvironmentConfig } from './config';
import { scopedLogger } from './logHelper';

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

    public async deleteFilesByPath(files: string[]): Promise<boolean> {
        let status = true;

        for (const file of files) {
            const stat = await this.deleteFile(file);
            status &&= stat;

        }
        return status;
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
            await new Promise((resolve) => {
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
    }
}

export const fileHelper = new FileHelper();