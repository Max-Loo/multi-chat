/**
 * Vue 单文件组件模块声明
 *
 * 供构建链路中的纯 tsc 识别 .vue 导入（vue-tsc 原生支持 SFC 类型，
 * 此声明保证 tsc --noEmit 与 CI 类型检查在共存期可用）。
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<Record<string, never>, Record<string, never>, any>;
  export default component;
}
