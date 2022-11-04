import { DatabaseHelper } from '../services/databaseHelper';
import { IEnvironmentVariables } from '../interfaces/environment-variables';
import { IDatabaseMigrator } from '../interfaces/databaseMigrator';

export class To_0_1_1_PR_87 extends DatabaseHelper implements IDatabaseMigrator {

    constructor(config: IEnvironmentVariables) {
        super(config);
    }

    /**
     * Adds userSettings: [] to all server settings
     */
    public async migrate(): Promise<void> {
        await this.serverInfoCollection.updateMany({}, {$set: {userSettings: []}});
        await this.close();
    }

    private async close(): Promise<void> {
        await this.client.close();
    }
}