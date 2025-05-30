module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime', 'plugin:react-hooks/recommended', 'plugin:storybook/recommended'],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'no-unused-vars': 'warn',
    'no-redeclare': 'warn',
    'react/prop-types': 'off',
    'no-case-declarations': 'off',
    'no-inner-declarations': "off",
    'no-prototype-builtins': 'warn',
    'react/jsx-no-target-blank': 'off',
    'no-fallthrough': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
