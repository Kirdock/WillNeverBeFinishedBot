import { DatabaseHelper } from './databaseHelper';
import semver from 'semver/preload';
import { logger } from './logHelper';
import { To_0_1_1_PR_87 } from '../migratorStrategies/to_0_1_1__p_r_87';
import { IDatabaseMigrator } from '../interfaces/databaseMigrator';
import { IEnvironmentVariables } from '../interfaces/environment-variables';

interface IMigrateStrategy {
    version: string;
    run: () => Promise<void>;
}

export async function migrateCheck(config: IEnvironmentVariables, databaseHelper: DatabaseHelper): Promise<void> {
    const oldVersion = await databaseHelper.getVersion();
    if (semver.valid(oldVersion) && (!semver.valid(config.VERSION) || semver.gte(oldVersion, config.VERSION))) {
        return;
    }
    logger.info('Old version detected. Starting migration...');
    await migrate(config, oldVersion, databaseHelper);
    await databaseHelper.setVersion(config.VERSION);
    logger.info('Migration succeeded');
}

async function migrate(config: IEnvironmentVariables, oldVersion: string, databaseHelper: DatabaseHelper): Promise<void> {
    let newDatabaseVersion = undefined;
    let latestExecutedStrategy = undefined;
    try {
        for (const strategy of getMigrateStrategies(config)) {
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

function getMigrateStrategies(config: IEnvironmentVariables): IMigrateStrategy[] {
    // why don't we just add new To_0_1_1_PR_87(config) to the array?
    //  because then a lot of potential not needed classes are generated (migrators and their mongo clients)
    return [
        {
            version: '0.1.1-dev-PR-87',
            run: () => executeMigrator(new To_0_1_1_PR_87(config)),
        }
    ].sort((a: IMigrateStrategy, b: IMigrateStrategy) => semver.compare(a.version, b.version));
}

async function executeMigrator(migrator: IDatabaseMigrator): Promise<void> {
    await migrator.run();
    await migrator.migrate();
}