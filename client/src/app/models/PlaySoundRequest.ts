export class PlaySoundRequest {

    constructor(public soundId: string | undefined, public forcePlay: boolean, public serverId: string, public channelId: string, public volume: number, public joinUser: boolean, public url: string) {}
}