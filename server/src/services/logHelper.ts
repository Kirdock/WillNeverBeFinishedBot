import { Logger } from './logger';

export const defaultLogLevel = 'debug';
export const logger: Logger = new Logger(process.env.LOG_LEVEL || defaultLogLevel);