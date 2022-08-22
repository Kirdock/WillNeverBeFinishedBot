export interface IPlaySoundRequest {
  soundId?: string;
  forcePlay: boolean;
  serverId: string;
  channelId: string;
  volume: number;
  joinUser: boolean;
  url: string;
}
