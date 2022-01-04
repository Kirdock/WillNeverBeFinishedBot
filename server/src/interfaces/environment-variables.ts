export const KEnvironmentVariables: (keyof IRequiredEnvironmentVariables)[] = [
    'CLIENT_TOKEN',
    'CLIENT_SECRET',
    'HOST',
    'PORT',
    'PREFIXES',
    'SCOPE',
    'DATABASE_NAME',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'WEBTOKEN_SECRET',
]

export interface IRequiredEnvironmentVariables {
    CLIENT_TOKEN: string;
    CLIENT_SECRET: string;
    HOST: string;
    PORT: string;
    PREFIXES: string;
    SCOPE: string;
    DATABASE_NAME: string;
    DATABASE_USER: string;
    DATABASE_PASSWORD: string;
    WEBTOKEN_SECRET: string;
    OWNERS?: string;
    VERSION?: string;
    DATABASE_CONTAINER_NAME?: string;
    MAX_RECORD_TIME_MINUTES?: string;
}

export interface IEnvironmentVariables extends IRequiredEnvironmentVariables {
    OWNERS: string;
    VERSION: string;
    DATABASE_CONTAINER_NAME: string;
    MAX_RECORD_TIME_MINUTES: string;
}