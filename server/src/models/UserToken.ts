export class UserToken {
    public access_token!: string;
    public token_type!: string;
    public expires_in!: number;
    public refresh_token!: string;
    public scope!: string;

    public time: number = new Date().getTime();
}