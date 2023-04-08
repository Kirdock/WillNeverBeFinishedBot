import { databaseHelper } from './databaseHelper';
import semver from 'semver/preload';
import { To_0_1_1_PR_87 } from '../migratorStrategies/to_0_1_1__p_r_87';
import type { IDatabaseMigrator } from '../interfaces/databaseMigrator';
import { scopedLogger } from './logHelper';
import { EnvironmentConfig } from './config';

const logger = scopedLogger('MIGRATOR');

interface IMigrateStrategy {
    version: string;
    run: () => Promise<void>;
}

export async function migrateCheck(): Promise<void> {
    const oldVersion = await databaseHelper.getVersion();
    if (semver.valid(oldVersion) && (!semver.valid(EnvironmentConfig.VERSION) || semver.gte(oldVersion, EnvironmentConfig.VERSION))) {
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
            if (semver.lt(oldVersion, strategy.version)) {
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
    ].sort((a: IMigrateStrategy, b: IMigrateStrategy) => semver.compare(a.version, b.version));
}

async function executeMigrator(migrator: IDatabaseMigrator): Promise<void> {
    await migrator.run();
    await migrator.migrate();
}