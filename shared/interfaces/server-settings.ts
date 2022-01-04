export interface IServerSettings {
    id: string;
    playIntro: boolean;
    playOutro: boolean;
    minUser: boolean;
    playIntroWhenUnmuted: boolean;
    leaveChannelAfterPlay: boolean;
    recordVoice: boolean;
    defaultIntro?: string;
    defaultOutro?: string;
}
