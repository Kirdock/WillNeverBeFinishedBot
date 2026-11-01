import type { IDatabaseHelper } from './databaseHelper.js';

export interface IDatabaseMigrator extends IDatabaseHelper {
    migrate: () => Promise<void>;
}
