import { databaseHelper } from './databaseHelper';
import { fileHelper } from './fileHelper';
import type { ISoundMeta } from '../interfaces/sound-meta';
import { scopedLogger } from './logHelper';

const logger = scopedLogger('DATA_SERVICE');

class DataService {
    public async deleteSound(meta: ISoundMeta, userId: string): Promise<void> {
        const filePath = meta.path;
        await databaseHelper.removeSoundMeta(meta._id);
        try {
            await fileHelper.deleteFile(filePath);
            await databaseHelper.logSoundDelete(userId, meta);
        } catch (error) {
            logger.error(error, 'DeleteFile');
            try {
                await databaseHelper.addSoundMeta(meta._id, meta.path, meta.fileName, meta.userId, meta.category, meta.serverId);
            } catch (error2) {
                logger.error(error2, 'AddSoundMeta');
            }

            throw new Error('SOUND_DELETE_ERROR');
        }
    }
}

export default new DataService();
