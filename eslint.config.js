import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],

    // Load recommended rules
    ...js.configs.recommended,

    languageOptions: {
      // Define global variables that ESLint should recognize (not flag as undefined)
      globals: {
        ...globals.node, // Node.js globals: process, __dirname, Buffer, console, etc.
        ...globals.es2021, // ES2021 globals: Promise, Map, Set, etc.
      },
      ecmaVersion: 'latest', // Parse latest ECMAScript syntax (allows modern JS features)
      sourceType: 'module', // Parse as ES modules (import/export) not CommonJS (require/module.exports)
    },

    // Code quality rules only via eslint
    rules: {
      // Warn on unused variables/imports
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_', // Allow unused params prefixed with _
          args: 'all', // Check all function args
        },
      ],
      'no-console': 'off', // Allow console.log/debug statements
      eqeqeq: ['error', 'always'], // Enforce === over == (prevent type coercion bugs)
      'no-var': 'error', // Prefer const/let over var (block scoping)
      'prefer-const': 'warn', // Suggest const when variable is never reassigned
      'no-throw-literal': 'error', // Only throw Error objects (not strings/primitives)
    },
  },

  // Styling rules via prettier
  prettierConfig,
]);
