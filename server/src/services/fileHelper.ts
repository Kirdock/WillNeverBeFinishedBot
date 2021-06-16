import { existsSync, promises as fs, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { basename, extname, join } from 'path';
import Logger from './logger';


export default class FileHelper {
    public readonly rootDir: string = join(__dirname, '/../../../');
    public readonly baseDir: string = join(this.rootDir, 'server', 'shared');
    public readonly soundFolder: string = join(this.baseDir, 'sounds');
    public readonly certFolder: string = join(this.baseDir, 'cert');

    constructor(private logger: Logger) {
        this.checkAndCreateFolderSystem();
    }

    public existsFile(path: string): boolean {
        return existsSync(path);
    }

    public async deleteFile(path: string): Promise<boolean> {
        let deleted = false;
        if (existsSync(path)) {
            try {
                await fs.unlink(path);
                deleted = true;
            }
            catch (e) {
                this.logger.error(e, { path });
            }
        }

        return deleted;
    }

    async deleteFiles(fileArray: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[]): Promise<boolean> {
        let status = false;
        const files: Express.Multer.File[] = this.getFiles(fileArray);

        for await (const file of files) {
            status &&= await this.deleteFile(file.path);
        }
        return status;
    }

    public getFiles(fileArray: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[]): Express.Multer.File[] {
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

    private checkAndCreateFolder(folder: string): void {
        if (!existsSync(folder)) {
            mkdirSync(folder);
        }
    }

    private checkAndCreateFolderSystem() {
        for (const folder of [this.baseDir, this.soundFolder]) {
            this.checkAndCreateFolder(folder);
        }
    }

    public getFileName(filePath: string): string {
        return basename(filePath, extname(filePath));
    }

    public checkAndCreateFile(filePath: string): void {
        if (!existsSync(filePath)) {
            writeFileSync(filePath, '{}');
        }
    }

    public readFile(filePath: string): Buffer {
        return readFileSync(filePath);
    }
}
