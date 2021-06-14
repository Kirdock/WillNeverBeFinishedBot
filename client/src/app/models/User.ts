export class User {
    public id!: string;
    public intros: {[key: string]: string} = {};
    public username: string | undefined;
}