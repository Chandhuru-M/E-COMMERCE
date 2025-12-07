module.exports = {
  root: true,
  env: {
    node: true,
    es2023: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json']
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:import/recommended', 'prettier'],
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json']
      }
    }
  },
  rules: {
    '@typescript-eslint/consistent-type-imports': 'warn',
    'import/order': [
      'warn',
      {
        groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling', 'index']],
        alphabetize: { order: 'asc', caseInsensitive: true },
        'newlines-between': 'always'
      }
    ]
  }
};
