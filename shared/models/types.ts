export type AudioExportType = 'single' | 'separate';
export type PickByType<T, Value> = {
    [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P]
}