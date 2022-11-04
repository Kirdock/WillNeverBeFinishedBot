export function getNormalizedDate(): string {
    return new Date().toISOString().split('.')[0].replace(/:/g, '-').replace(/T/g, ' ');
}