import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.svelte-kit/**',
      'app/**'
    ]
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  prettier,
  {
    files: ['api/**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['api/**/*.ts', 'sdk/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024
      }
    }
  },
  {
    files: ['api/**/*.test.ts', 'api/**/*.spec.ts', 'sdk/**/*.test.ts', 'sdk/**/*.spec.ts'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
);
