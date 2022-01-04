export type FileInfo = { src: string, fullName: string };

export class SoundMeta {
  public time!: number;
  public _id!: string;
  public fileName!: string;
  public category!: string;
  public userId!: string;
  public username?: string;
  public serverId!: string;
  public fileInfo?: FileInfo;

  public setFileInfo(src: string, fullName: string): this is (SoundMeta & { fileInfo: FileInfo }) {
    this.fileInfo = {src, fullName};
    return true;
  }

  public static fromJSON(data: any): SoundMeta {
    return Object.assign(new this(), data);
  }
}
