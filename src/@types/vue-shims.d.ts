/**
 * Vue SFC 模块类型声明
 * 让 TypeScript 识别 .vue 单文件组件的默认导出
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<Record<string, any>, Record<string, any>, any>;
  export default component;
}
