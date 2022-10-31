export function sortUsers<T extends { username: string } []>(users: T): T {
    return users.sort((a, b) => a.username.localeCompare(b.username));
}