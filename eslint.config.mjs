import js from '@eslint/js'
import globals from 'globals'
import workspaces from 'eslint-plugin-workspaces'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import vitest from 'eslint-plugin-vitest'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  { files: ['**/*.{js,mjs,cjs,ts,mts,cts}'], plugins: { js }, extends: ['js/recommended'] },
  { files: ['**/*.{js,mjs,cjs,ts,mts,cts}'], languageOptions: { globals: globals.node } },
  {
    ...workspaces.configs['flat/recommended'],
  },
  // TypeScript Defaults
  tseslint.configs.strictTypeChecked.map(config => ({
    ...config,
    files: ['**/*.{ts,mts}'],
  })),
  tseslint.configs.stylisticTypeChecked.map(config => ({
    ...config,
    files: ['**/*.{ts,mts}'],
  })),
  // TypeScript Overrides
  {
    files: ['**/*.{ts,mts}'],
    rules: {
      // Правило несовместимо с wb-rules 2.0
      '@typescript-eslint/prefer-includes': 'off',
      // Разрешает интерполяцию базовых типов
      '@typescript-eslint/restrict-template-expressions': ['error', {
        allowAny: false,
        allowBoolean: true,
        allowNullish: true,
        allowNumber: true,
        allowRegExp: true,
      }],
    },
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.json',
          './packages/*/tsconfig.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // TypeScript Type Definition Overrides
  {
    files: ['packages/*/types/**/*.d.ts'],
    rules: {
      'no-var': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/triple-slash-reference': ['error', {
        lib: 'always',
        path: 'always',
        types: 'prefer-import',
      }],
    },
  },
  // Stylistic Defaults
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    ...stylistic.configs.customize({
      quotes: 'single',
      quoteProps: 'consistent',
      indent: 2,
    }),
  },
  // Stylistic Overrides
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    rules: {
      '@stylistic/comma-dangle': ['error', {
        'arrays': 'always-multiline',
        'objects': 'always-multiline',
      }],
      '@stylistic/curly-newline': ['error', 'always'],
      '@stylistic/nonblock-statement-body-position': ['error', 'below'],
      '@stylistic/padded-blocks': ['error', {
        'blocks': 'always',
      }],
    },
  },
  // Vitest Defaults
  {
    files: ['tests/**'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },
  globalIgnores([
    'node_modules/',
    'dist/',
    'packages/*/dist/',
    'packages/create-mirta/public/templates/**/*',
  ]),
])
