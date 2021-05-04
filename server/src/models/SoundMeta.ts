export class SoundMeta {
    private time: Date;

    constructor(public id: number, public path: string, public fileName: string, public category: string, public userId: string, public serverId: string) {
        // consider if only id or id and username should be saved
        this.time = new Date();
    }
}