export function buildSteamLinkOutOfMessage(content: string): string | undefined {
    const urlRegex = /(https:\/\/(store\.steampowered|steamcommunity)\.com\/[^\s]+)/g;
    const url = content.trim().match(urlRegex)?.[0];

    return url ? `steam://openurl/${url}` : undefined;
}
