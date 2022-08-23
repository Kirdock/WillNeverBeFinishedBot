export interface IUser {
  id: string;
  intros: { [key: string]: string | undefined };
  username?: string;
}
