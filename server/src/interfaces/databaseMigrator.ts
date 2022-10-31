import { IDatabaseHelper } from './databaseHelper';

export interface IDatabaseMigrator extends IDatabaseHelper {
    migrate: () => Promise<void>;
}