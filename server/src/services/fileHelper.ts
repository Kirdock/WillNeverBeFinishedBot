import { lstatSync, existsSync, readdirSync, promises as fs, mkdirSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';
import Logger from './logger';


export default class FileHelper {
    public soundFolder: string;

    constructor(private logger: Logger){
        this.checkAndCreateFolderSystem();
        this.soundFolder = join(__dirname+'/../assets/sounds');
    }

    private isDirectory(source: string): boolean{
        return lstatSync(source).isDirectory();
    }

    private getDirectories(source: string): string[]{
        return readdirSync(source).map(name => join(source, name)).filter(this.isDirectory);
    }
    
    getDirectoriesOfSoundFolder(): string[]{
        return this.getDirectories(this.soundFolder);
    }

    public existsFile(folder: string): boolean{
        return existsSync(folder);
    }

    public async deleteFile(path: string): Promise<boolean>{
        let deleted = false;
        if(existsSync(path)){
            try{
                await fs.unlink(path);
                deleted = true;
            }
            catch(e){
                this.logger.error(e,{path});
            }
        }

        return deleted;
    }

    async deleteFiles(fileArray: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[]): Promise<boolean>{
        let status = false;
        let files: Express.Multer.File[] = this.getFileNames(fileArray);

        for await (let file of files) {
            this.deleteFile(file.path);
        }
        return status;
    }

    public getFileNames(fileArray: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[]): Express.Multer.File[] {
        let files: Express.Multer.File[] = [];
        if(fileArray instanceof File) {
            files = fileArray as Express.Multer.File[];
        } else {
            fileArray = fileArray as { [fieldname: string]: Express.Multer.File[]; }
            for(let key in files) {
                files.push(...fileArray[key]);
            }
        }
        return files;
    }

    checkAndCreateFolder(dir: string){
        const folder = dir;
        if(!existsSync(folder)){
            mkdirSync(folder);
        }
    }

    private checkAndCreateFolderSystem(){
        const files = ['/../assets', '/../config', '/../assets/sounds'];
        files.forEach(folder =>{
            this.checkAndCreateFolder(join(__dirname,folder));
        })
    }

    getFileName(filePath: string){
        return basename(filePath, extname(filePath));
    }

    public checkAndCreateFile(filePath: string){
        if(!existsSync(filePath)){
            writeFileSync(filePath,'{}');
        }
    }
}
