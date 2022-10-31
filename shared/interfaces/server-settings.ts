export interface IServerUserSettings {
    id: string;
    recordVolume: number
}

export interface IServerSettings {
    id: string;
    playIntro: boolean;
    playOutro: boolean;
    minUser: boolean;
    playIntroWhenUnmuted: boolean;
    leaveChannelAfterPlay: boolean;
    recordVoice: boolean;
    userSettings?: IServerUserSettings[],
    defaultIntro?: string;
    defaultOutro?: string;
}
