export class User {
    public id!: string;
    public intros: {[key: string]: string | undefined} = {};
    public username?: string;
}