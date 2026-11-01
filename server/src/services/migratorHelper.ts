import { databaseHelper } from './databaseHelper.js';
import { valid, gte, lt, compare } from 'semver';
import { To_0_1_1_PR_87 } from '../migratorStrategies/to_0_1_1__p_r_87.js';
import type { IDatabaseMigrator } from '../interfaces/databaseMigrator.js';
import { scopedLogger } from './logHelper.js';
import { EnvironmentConfig } from './config.js';

const logger = scopedLogger('MIGRATOR');

interface IMigrateStrategy {
    version: string;
    run: () => Promise<void>;
}

export async function migrateCheck(): Promise<void> {
    const oldVersion = await databaseHelper.getVersion();
    if (valid(oldVersion) && (!valid(EnvironmentConfig.VERSION) || gte(oldVersion, EnvironmentConfig.VERSION))) {
        return;
    }
    logger.info('Old version detected. Starting migration...');
    await migrate(oldVersion);
    await databaseHelper.setVersion(EnvironmentConfig.VERSION);
    logger.info('Migration succeeded');
}

async function migrate(oldVersion: string): Promise<void> {
    let newDatabaseVersion = undefined;
    let latestExecutedStrategy = undefined;
    try {
        for (const strategy of getMigrateStrategies()) {
            if (lt(oldVersion, strategy.version)) {
                latestExecutedStrategy = strategy.version;

                logger.info(`Migrating to version ${strategy.version}`);
                await strategy.run();
                newDatabaseVersion = strategy.version;
            }
        }
    } catch (e) {
        if (newDatabaseVersion) {
            await databaseHelper.setVersion(newDatabaseVersion);
        }
        logger.error(e as Error, `Error while migrating to next version. Migrator path: old ${newDatabaseVersion}, new ${latestExecutedStrategy}`);
        process.exit(1);
    }
}

function getMigrateStrategies(): IMigrateStrategy[] {
    // why don't we just add new To_0_1_1_PR_87(config) to the array?
    //  because then a lot of potential not needed classes are generated (migrators and their mongo clients)
    return [
        {
            version: '0.1.1-dev-PR-87',
            run: () => executeMigrator(new To_0_1_1_PR_87()),
        }
    ].sort((a: IMigrateStrategy, b: IMigrateStrategy) => compare(a.version, b.version));
}

async function executeMigrator(migrator: IDatabaseMigrator): Promise<void> {
    await migrator.run();
    await migrator.migrate();
}
