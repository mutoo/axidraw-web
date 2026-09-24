import eslintReact from '@eslint-react/eslint-plugin';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { createNodeResolver, importX } from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// eslint-plugin-react-hooks owns the hooks and React Compiler rules,
// so turn off ESLint React's copies to avoid duplicate reports.
const eslintReactHookRules = [
  'rules-of-hooks',
  'exhaustive-deps',
  'error-boundaries',
  'purity',
  'set-state-in-effect',
  'set-state-in-render',
  'static-components',
  'unsupported-syntax',
  'use-memo',
];

export default defineConfig(globalIgnores(['dist']), {
  files: ['**/*.{ts,tsx}'],
  extends: [
    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    eslintReact.configs['recommended-type-checked'],
    reactHooks.configs.flat.recommended,
    prettier,
  ],
  languageOptions: {
    globals: globals.browser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  settings: {
    'import-x/resolver-next': [
      // resolves through ./tsconfig.json and its project references
      createTypeScriptImportResolver({ alwaysTryTypes: true }),
      createNodeResolver(),
    ],
  },
  plugins: {
    'react-refresh': reactRefresh.plugin,
  },
  rules: {
    ...Object.fromEntries(
      eslintReactHookRules.map((rule) => [`@eslint-react/${rule}`, 'off']),
    ),
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // TypeScript already checks member access on default imports
    'import-x/no-named-as-default-member': 'off',
    'import-x/order': [
      'error',
      {
        pathGroups: [
          {
            pattern: '@/**',
            group: 'external',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/restrict-template-expressions': [
      'error',
      {
        allowNumber: true,
      },
    ],
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
});
