import pluginVue from 'eslint-plugin-vue';
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
    files: ['**/*.vue'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...pluginVue.configs['flat/recommended'].rules,
    },
  },
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  ...pluginVue.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['**/*.vue'],
  })),
];
