/**
 * Vue 全局类型声明
 *
 * 将 @vue/runtime-dom 的 HTMLAttributes 等类型提升为全局类型，
 * 供 UI 组件 SFC 中直接使用（对齐 React 版全局 JSX 属性类型的书写体验）。
 */
import type * as Vue from 'vue';

declare global {
  type HTMLAttributes = Vue.HTMLAttributes;
}

// 保持模块形态（类型-only 声明文件）
export type VueGlobals = typeof Vue;
