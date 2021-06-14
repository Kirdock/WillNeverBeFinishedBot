export class Log {
    public serverId!: string;
    public userId!: string;
    public action!: string;
    public file?: {fileName: string};
    public time: string = new Date().toISOString();
    public username?: string;
}