export class ServerSettings {
  public id: string = '';
  public playIntro: boolean = false;
  public playOutro: boolean = false;
  public minUser: boolean = false;
  public playIntroWhenUnmuted: boolean = false;
  public leaveChannelAfterPlay: boolean = false;
  public recordVoice: boolean = false;
  public defaultIntro?: string;
  public defaultOutro?: string;
}
