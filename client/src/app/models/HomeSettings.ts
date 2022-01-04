export class HomeSettings {
  public volume: number = 0.5;
  public selectedServerId?: string;
  public selectedChannelId?: string;
  public joinUser: boolean = true;
  public recordVoiceMinutes: number = 1;

  static fromJSON(data: any) {
    return Object.assign(new this(), data);
  }
}
