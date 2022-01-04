import { IServerSettings } from '../../../../shared/interfaces/server-settings';

export interface IServer {
  id: string;
  name: string;
  icon?: string;
  isAdmin: boolean;
  permissions: number;
  settings: IServerSettings;
}
