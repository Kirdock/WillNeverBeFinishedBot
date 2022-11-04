import { existsSync, mkdirSync, readFileSync } from 'fs';
import { basename, extname, join } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { rename, unlink } from 'fs/promises';
import { logger } from './logHelper';
import { EnvironmentConfig } from './config';

export namespace FileHelper {
    export const rootDir: string = EnvironmentConfig?.ROOT_DIR || join(__dirname, '/../../../');
    export const baseDir: string = join(rootDir, 'server', 'shared');
    export const soundFolder: string = join(baseDir, 'sounds');
    export const certFolder: string = join(baseDir, 'cert');
    export const workFolder: string = join(soundFolder, 'work');

    checkAndCreateFolderSystem();

    function checkAndCreateFolderSystem() {
        for (const folder of [baseDir, soundFolder, workFolder]) {
            checkAndCreateFolder(folder);
        }
    }

    function checkAndCreateFolder(folder: string): void {
        if (!existsSync(folder)) {
            mkdirSync(folder);
        }
    }

    export function existsFile(path: string): boolean {
        return existsSync(path);
    }

    export async function deleteFile(path: string): Promise<boolean> {
        let deleted = false;
        if (existsFile(path)) {
            try {
                await unlink(path);
                deleted = true;
            } catch (e) {
                logger.error(e as Error, {path});
            }
        }

        return deleted;
    }

    export async function deleteFilesByPath(files: string[]): Promise<boolean> {
        let status = true;

        for (const file of files) {
            const stat = await deleteFile(file);
            status &&= stat;

        }
        return status;
    }

    export async function deleteFiles(fileArray: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[]): Promise<boolean> {
        let status = true;
        const files: Express.Multer.File[] = getFiles(fileArray);

        for await (const file of files) {
            const stat = await deleteFile(file.path);
            status &&= stat;
        }
        return status;
    }

    export function getFiles(fileArray: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[]): Express.Multer.File[] {
        let files: Express.Multer.File[] = [];
        if (fileArray instanceof Array) {
            files = fileArray as Express.Multer.File[];
        } else {
            fileArray = fileArray as { [fieldname: string]: Express.Multer.File[]; }
            for (const key in fileArray) {
                files.push(...fileArray[key]);
            }
        }
        return files;
    }

    export function getFileName(filePath: string): string {
        return basename(filePath, extname(filePath));
    }

    export function readFile(filePath: string): Buffer {
        return readFileSync(filePath);
    }

    export async function normalizeFiles(files: Express.Multer.File[]): Promise<void> {
        for (const file of files) {
            await new Promise(resolve => {
                const newFileName = getFileName(file.filename) + '.mp3';
                const tempPath = join(workFolder, newFileName);
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
                            await deleteFile(tempPath);
                        }
                        resolve(true);
                    })
                    .save(tempPath);
            });
        }
    }
}