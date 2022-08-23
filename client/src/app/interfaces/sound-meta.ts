export type FileInfo = { src: string, fullName: string };

export type ISounds = { [key: string]: ISoundMeta[] };

export interface ISoundMeta {
  time: number;
  _id: string;
  fileName: string;
  category: string;
  userId: string;
  username?: string;
  serverId: string;
  fileInfo?: FileInfo;
}
