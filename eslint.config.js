import pluginVue from 'eslint-plugin-vue';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'src/__test__/**'],
  },
  ...pluginVue.configs['flat/essential'],
  {
    rules: {
      // 项目沿用 shadcn 单词组件名（Button/Input）与页面 index.vue 惯例，
      // 与 React 版保持一致，关闭多词组件名强制
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    // SFC 内的 TypeScript 交由 TS 解析器处理
    files: ['src/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        sourceType: 'module',
      },
    },
  },
];
