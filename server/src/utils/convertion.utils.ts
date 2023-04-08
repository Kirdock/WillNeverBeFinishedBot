export function asNumberOrUndefined(value: string): number | undefined {
    if (value === '') {
        return undefined;
    }
    const parsed = +value;
    if (isNaN(parsed)) {
        return undefined;
    }
    return parsed;
}
