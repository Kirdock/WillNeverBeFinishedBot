export default function escapeStringRegexp(text: string): string {
    return text
        .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
        .replace(/-/g, '\\x2d');
}
