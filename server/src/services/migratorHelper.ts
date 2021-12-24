import { DatabaseHelper } from './databaseHelper';
import semver from 'semver/preload';
import { Logger } from './logger';

interface IMigrateStrategy {
    version: string;
    run: () => Promise<void>;
}

export class MigratorHelper {
    private readonly migrateStrategies: IMigrateStrategy[] = [].sort((a: IMigrateStrategy, b: IMigrateStrategy) => semver.compare(a.version, b.version));

    constructor(private database: DatabaseHelper, private logger: Logger, private version: string) {
    }

    public async migrateCheck(): Promise<void> {
        const oldVersion = await this.database.getVersion();
        if(!semver.valid(oldVersion) || (semver.valid(this.version) && semver.lt(oldVersion, this.version))) {
            this.logger.info('Old version detected. Starting migration...');
            await this.migrate(oldVersion);
            await this.database.setVersion(this.version);
            this.logger.info('Migration succeeded');
        }
    }

    private async migrate(version: string): Promise<void> {
        let newDatabaseVersion = undefined;
        try {
            for (const strategy of this.migrateStrategies) {
                if (semver.lt(version, strategy.version)) {
                    this.logger.info(`Migrating to version ${strategy.version}`);
                    await strategy.run();
                }
                newDatabaseVersion = strategy.version;
            }
            newDatabaseVersion = version;
        } catch (e) {
            if (newDatabaseVersion){
                await this.database.setVersion(newDatabaseVersion);
            }
            this.logger.error(e, `Error while migrating to next version of ${newDatabaseVersion ?? version}`);
            process.exit(1);
        }
    }
}