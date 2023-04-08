export class InteractionError extends Error {
    constructor(public message: string) {
        super();
    }
}
