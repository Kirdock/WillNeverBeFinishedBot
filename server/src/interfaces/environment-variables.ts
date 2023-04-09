const requiredEnvironmentVariableKeys: { [key in keyof IRequiredEnvironmentVariables]: boolean } = {
    CLIENT_TOKEN: true,
    CLIENT_SECRET: true,
    HOST: true,
    PORT: true,
    SCOPE: true,
    DATABASE_NAME: true,
    DATABASE_USER: true,
    DATABASE_PASSWORD: true,
    WEBTOKEN_SECRET: true,
};

export interface IRequiredEnvironmentVariables {
    CLIENT_TOKEN: string;
    CLIENT_SECRET: string;
    HOST: string;
    PORT: string;
    SCOPE: string;
    DATABASE_NAME: string;
    DATABASE_USER: string;
    DATABASE_PASSWORD: string;
    WEBTOKEN_SECRET: string;
    LOG_LEVEL?: string;
    OWNERS?: string;
    VERSION?: string;
    DATABASE_CONTAINER_NAME?: string;
    MAX_RECORD_TIME_MINUTES?: string;
    ROOT_DIR?: string;
}

export interface IEnvironmentVariables extends IRequiredEnvironmentVariables {
    OWNERS: string;
    VERSION: string;
    DATABASE_CONTAINER_NAME: string;
    MAX_RECORD_TIME_MINUTES: string;
    LOG_LEVEL: string;
    OPENAI_API_KEY?: string;
    OPENAI_API_MODEL?: string;
}

export const KEnvironmentVariables: (keyof IRequiredEnvironmentVariables)[] = Object.keys(requiredEnvironmentVariableKeys) as (keyof IRequiredEnvironmentVariables)[];
