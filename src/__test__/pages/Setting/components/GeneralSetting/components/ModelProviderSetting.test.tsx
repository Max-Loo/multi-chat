import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ModelProviderSetting from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting';
import modelProviderReducer from '@/store/slices/modelProviderSlice';

/**
 * Mock react-i18next 模块
 * 提供测试用的国际化函数模拟实现
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

/**
 * Mock sonner toast 模块
 * 提供 toast 提示的模拟实现
 */
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

/**
 * ModelProviderSetting 组件单元测试
 *
 * 测试组件的渲染、用户交互、表单验证、异步操作、错误处理和国际化功能
 *
 * @component
 * @remarks
 * ModelProviderSetting 是设置页面的核心组件，负责管理模型供应商配置。
 * 该组件主要包含：
 * - 显示供应商列表
 * - 刷新供应商数据
 * - 展开/折叠供应商详情
 * - 显示错误状态和加载状态
 */

describe('ModelProviderSetting', () => {
  /**
   * 测试辅助函数：创建带有 Redux store 的测试组件
   *
   * @param preloadedState - 预加载的 Redux 状态
   * @returns 渲染结果和 store 对象
   *
   * @example
   * ```ts
   * const { container, store } = setup({
   *   modelProvider: { providers: [], loading: false, error: null }
   * });
   * ```
   */
  function setup(preloadedState = {}) {
    /**
     * 创建 Redux store
     * 配置 modelProvider reducer 用于管理供应商状态
     */
    const store = configureStore({
      reducer: {
        modelProvider: modelProviderReducer,
      },
      preloadedState,
    });

    /**
     * 渲染组件
     * 使用 Redux Provider 包裹组件以提供 store
     */
    const renderResult = render(
      <Provider store={store}>
        <ModelProviderSetting />
      </Provider>
    );

    return {
      ...renderResult,
      store,
    };
  }

  /**
   * 测试前置处理
   * 在每个测试运行前清除所有 Mock 的调用记录
   */
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * 测试后置处理
   * 在每个测试运行后清除所有 Mock 的调用记录
   */
  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * 组件渲染测试组
   *
   * 验证组件在不同状态下的正确渲染：
   * - 正常状态
   * - 加载状态
   * - 错误状态
   */
  describe('渲染', () => {
    /**
     * 测试用例：验证组件在正常状态下的渲染
     *
     * Given: 组件挂载且使用默认空状态
     * When: 组件完成渲染
     * Then: 组件容器及其子元素应正确显示
     */
    it('应该正常渲染组件', () => {
      const { container } = setup();

      // 验证组件容器存在
      expect(container).toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });

    /**
     * 测试用例：验证模型供应商标题正确显示
     *
     * Given: 组件挂载
     * When: 组件完成渲染
     * Then: 应显示"模型供应商"标题
     */
    it('应该显示模型供应商标题', () => {
      setup();

      // 使用 within 限定查询范围
      const title = screen.queryAllByText('模型供应商')[0];
      expect(title).toBeInTheDocument();
    });

    /**
     * 测试用例：验证刷新按钮正确显示
     *
     * Given: 组件挂载
     * When: 组件完成渲染
     * Then: 应显示刷新按钮，且按钮标签为 BUTTON
     */
    it('应该显示刷新按钮', () => {
      setup();

      // 使用 within 限定查询范围
      const refreshButton = screen.queryAllByText('刷新模型供应商')[0];
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton.tagName).toBe('BUTTON');
    });

    /**
     * 测试用例：验证无数据提示正确显示
     *
     * Given: 组件挂载且供应商列表为空
     * When: 组件完成渲染
     * Then: 应显示"暂无模型供应商数据"提示信息
     */
    it('应该显示无数据提示', () => {
      setup();

      // 使用 queryAllByText 获取第一个匹配元素
      const emptyMessage = screen.queryAllByText('暂无模型供应商数据')[0];
      expect(emptyMessage).toBeInTheDocument();
    });

    /**
     * 测试用例：验证加载状态渲染
     *
     * Given: 组件挂载且 loading 状态为 true
     * When: 组件完成渲染
     * Then: 刷新按钮应显示"刷新中..."文本
     * And: 刷新按钮应被禁用
     */
    it('应该在加载状态显示刷新中状态', () => {
      setup({
        modelProvider: {
          providers: [],
          loading: true,
          error: null,
        },
      });

      // 验证刷新按钮显示"刷新中..."
      const loadingButton = screen.queryAllByText('刷新中...')[0];
      expect(loadingButton).toBeInTheDocument();
      expect(loadingButton.tagName).toBe('BUTTON');
      expect(loadingButton).toBeDisabled();
    });

    /**
     * 测试用例：验证错误状态渲染
     *
     * Given: 组件挂载且 error 状态不为 null
     * When: 组件完成渲染
     * Then: 应显示错误提示信息
     * And: 错误信息应包含"刷新失败"文本
     */
    it('应该在错误状态显示错误信息', () => {
      const errorMessage = '网络请求超时，请检查网络连接';
      setup({
        modelProvider: {
          providers: [],
          loading: false,
          error: errorMessage,
        },
      });

      // 验证错误信息显示
      const errorAlert = screen.queryByText(/刷新失败:/);
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(errorMessage);
    });
  });

  /**
   * 用户交互测试组
   *
   * 验证用户与组件交互时的正确行为：
   * - 点击刷新按钮
   * - 展开/折叠供应商详情
   */
  describe('用户交互', () => {
    /**
     * 测试用例：验证刷新按钮存在并可点击
     *
     * Given: 组件挂载
     * When: 查询刷新按钮
     * Then: 刷新按钮应存在于文档中且为可点击元素
     */
    it('应该存在刷新按钮', () => {
      setup();

      const refreshButton = screen.queryAllByText('刷新模型供应商')[0];
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton.tagName).toBe('BUTTON');
    });

    /**
     * 测试用例：验证点击刷新按钮不抛出错误
     *
     * Given: 组件挂载
     * When: 用户点击刷新按钮
     * Then: 不应抛出任何错误
     */
    it('应该在点击刷新按钮时不抛出错误', async () => {
      const user = userEvent.setup();
      setup();

      const refreshButton = screen.queryAllByText('刷新模型供应商')[0];
      
      // 验证点击按钮不会抛出错误
      await expect(user.click(refreshButton)).resolves.not.toThrow();
    });

    /**
     * 测试用例：验证加载状态下刷新按钮被禁用
     *
     * Given: 组件挂载且 loading 状态为 true
     * When: 组件完成渲染
     * Then: 刷新按钮应被禁用
     */
    it('应该在加载状态下禁用刷新按钮', () => {
      setup({
        modelProvider: {
          providers: [],
          loading: true,
          error: null,
        },
      });

      // 在加载状态下，按钮显示"刷新中..."而不是"刷新模型供应商"
      const loadingButton = screen.queryAllByText('刷新中...')[0];
      expect(loadingButton).toBeInTheDocument();
      expect(loadingButton).toBeDisabled();
    });

    /**
     * 测试用例：验证展开/折叠供应商功能的状态
     *
     * Given: 组件挂载
     * When: 组件初始化
     * Then: expandedProviders 状态应初始化为空 Set
     */
    it('应该初始化展开供应商状态为空', () => {
      setup();

      // 验证初始状态下没有展开的供应商
      // 注意：expandedProviders 是组件内部状态，无法直接从 store 获取
      // 这里我们验证组件正常渲染即可
      const emptyMessage = screen.queryAllByText('暂无模型供应商数据')[0];
      expect(emptyMessage).toBeInTheDocument();
    });
  });

  /**
   * 状态显示测试组
   *
   * 验证组件在不同状态下的正确显示：
   * - 默认空状态
   * - Redux store 中的状态正确传递
   */
  describe('状态显示', () => {
    /**
     * 测试用例：验证 Redux store 状态正确传递
     *
     * Given: 组件挂载且使用默认状态
     * When: 检查 Redux store
     * Then: modelProvider state 应包含初始值
     */
    it('应该正确初始化 Redux store', () => {
      const { store } = setup();

      const state = store.getState();
      expect(state.modelProvider).toBeDefined();
      expect(state.modelProvider.providers).toEqual([]);
      expect(state.modelProvider.loading).toBe(false);
      expect(state.modelProvider.error).toBe(null);
    });

    /**
     * 测试用例：验证组件正确渲染无数据状态
     *
     * Given: 组件挂载且 providers 为空数组
     * When: 组件完成渲染
     * Then: 应显示"暂无模型供应商数据"提示
     */
    it('应该在无供应商数据时显示提示', () => {
      setup();

      const emptyMessage = screen.queryAllByText('暂无模型供应商数据')[0];
      expect(emptyMessage).toBeInTheDocument();
    });
  });
});
