/**
 * Vue 单文件组件模块声明
 * 让 TypeScript 识别 .vue 文件导入
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
  export default component;
}
