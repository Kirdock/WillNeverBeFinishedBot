export class Log {
    public serverId!: string;
    public userId!: string;
    public action!: string;
    public file?: {fileName: string};
    public time!: number;
    public username?: string;
}