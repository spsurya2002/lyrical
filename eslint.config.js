import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'design/**',
      'specs/**',
      '.specify/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // CLAUDE.md §4: never add `any` to silence a type error.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // CLAUDE.md §6: no error swallowed into a default that looks like success.
      'no-empty': ['error', { allowEmptyCatch: false }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Playwright requires the first argument of a test hook to be a
    // destructuring pattern, even when the hook needs no fixture. An empty
    // pattern is the framework's idiom here, not an oversight.
    files: ['**/tests/e2e/**/*.ts'],
    rules: { 'no-empty-pattern': 'off' },
  },
  {
    // Config files and repo scripts run in Node and legitimately use its globals.
    files: ['**/*.config.ts', '**/*.config.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly' },
    },
  },
);
