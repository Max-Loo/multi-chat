/**
 * Redux 渲染辅助工具
 * 
 * 提供带有 Redux Provider 的组件渲染函数
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { configureStore, Store } from '@reduxjs/toolkit';

/**
 * 带有 Redux Provider 的渲染选项
 */
export interface RenderWithReduxOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Redux store 实例，如果不提供则自动创建 */
  store?: Store;
  /** Redux reducers，用于自动创建 store */
  reducers?: Record<string, any>;
  /** 初始 state，用于自动创建 store */
  preloadedState?: any;
}

/**
 * 带有 Redux Provider 的渲染函数
 * @param ui 要渲染的 React 元素
 * @param options 渲染选项
 * @returns 渲染结果和 store
 */
export function renderWithRedux(
  ui: ReactElement,
  options: RenderWithReduxOptions = {},
) {
  const {
    store,
    reducers = {},
    preloadedState,
    ...renderOptions
  } = options;

  // 如果没有提供 store，则自动创建
  const actualStore = store || configureStore({
    reducer: reducers as any,
    preloadedState,
  });

  // 创建带有 Redux Provider 的 wrapper
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={actualStore}>{children}</Provider>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store: actualStore,
  };
}

/**
 * 带有 Redux Provider 和 Router 的渲染函数
 * @param ui 要渲染的 React 元素
 * @param options 渲染选项
 * @returns 渲染结果和 store
 */
export function renderWithReduxAndRouter(
  ui: ReactElement,
  options: RenderWithReduxOptions & {
    /** 路由路径，默认为 '/' */
    route?: string;
  } = {},
) {
  const { ...reduxOptions } = options;

  // TODO: 在需要时可以添加 Router Provider
  // 目前先使用 renderWithRedux，后续可以扩展
  return renderWithRedux(ui, reduxOptions);
}
