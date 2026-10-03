import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

/**
 * ESLint flat config
 *
 * 分工约定：
 * - oxlint 负责 .ts/.js 文件（见 .oxlintrc.json）
 * - eslint + eslint-plugin-vue 仅负责 .vue 单文件组件
 */
export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      vue: pluginVue,
    },
    rules: {
      ...pluginVue.configs['flat/recommended'].rules,
    },
  },
];
