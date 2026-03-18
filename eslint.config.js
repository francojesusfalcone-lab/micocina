export default [
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'warn',
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: true, document: true, navigator: true,
        console: true, setTimeout: true, clearTimeout: true,
        Promise: true, JSON: true, Math: true, Date: true,
        localStorage: true, sessionStorage: true, performance: true,
        URL: true, URLSearchParams: true, fetch: true,
        indexedDB: true, IDBKeyRange: true, React: true,
        module: true, process: true, __dirname: true,
      }
    }
  }
]
