import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['src/storage/entities.generated.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
