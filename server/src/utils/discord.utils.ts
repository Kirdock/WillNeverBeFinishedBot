export function generateUserMention(id: string): string {
    return `<@${id}>`;
}

export function generateChannelMention(id: string): string {
    return `<#${id}>`;
}
