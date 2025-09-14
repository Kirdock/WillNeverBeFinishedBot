// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default defineConfig(
    eslintPluginPrettier,
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        files: ["index.ts", "src/**/*.ts"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                sourceType: "module",
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
        },
        rules: {
            quotes: ["error", "single"],
            indent: ["error", 4],
            semi: "error",
            "object-curly-spacing": ["error", "always"],
            "keyword-spacing": "error",
            "comma-spacing": "error",
            "space-before-blocks": "error",
            "comma-dangle": ["error", { objects: "only-multiline" }],
            curly: "error",
            "arrow-parens": "error",
            "eol-last": "error",
            "@typescript-eslint/no-unnecessary-condition": "error",
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                { ignoreRestSiblings: true },
            ],
        },
    },
    {
        ignores: ["node_modules", "eslint.config.mjs"]
    }
);