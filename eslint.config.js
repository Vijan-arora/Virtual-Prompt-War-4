import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', 12],
    },
  },
  {
    files: ['client/**/*.{ts,tsx}'],
    extends: [jsxA11y.flatConfigs.recommended],
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/tests/**/*.{ts,tsx}'],
    rules: {
      // Test suites legitimately exceed function-length limits inside describe blocks.
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // supertest response bodies and mock return values are typed `any`;
      // asserting on them in tests is expected and safe.
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/dot-notation': 'off',
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // Repo tooling and e2e specs live outside the client/server tsconfig
    // projects, and don't need the same project-aware strictness as
    // application code — lint them syntactically instead.
    files: ['*.cjs', 'playwright.config.ts', 'playwright.live.config.ts', 'e2e/**/*.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: { module: 'readonly', require: 'readonly' },
    },
  },
  {
    files: ['tests/load/**/*.js'],
    languageOptions: {
      globals: {
        __ENV: 'readonly',
        __VU: 'readonly',
        __ITER: 'readonly',
      },
    },
    rules: {
      // k6 scripts run in k6's own JS runtime; the default-export function
      // is invoked by k6 itself, not by our own app code, so the usual
      // module-boundary typing rule doesn't apply here.
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
);
