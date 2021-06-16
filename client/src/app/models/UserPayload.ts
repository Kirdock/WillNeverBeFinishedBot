export class UserPayload {
    constructor(public id: string, public username: string, public isSuperAdmin = false){}
}