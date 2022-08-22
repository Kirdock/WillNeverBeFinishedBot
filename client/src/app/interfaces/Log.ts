export interface ILog {
  serverId: string;
  userId: string;
  action: string;
  file?: { fileName: string };
  time: number;
  username?: string;
}
