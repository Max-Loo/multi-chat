import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AutoNamingSetting from '@/pages/Setting/components/GeneralSetting/components/AutoNamingSetting';
import appConfigReducer from '@/store/slices/appConfigSlices';

/**
 * Mock react-i18next 模块
 * 提供测试用的国际化函数模拟实现，支持类型安全语法
 *
 * 注意：由于 Vitest hoisting 机制，mock 必须内联定义，不能引用外部变量
 */
vi.mock('react-i18next', () => {
  const zhResources = {
    setting: {
      autoNaming: {
        title: '自动命名',
        description: '自动为聊天生成标题，默认开启',
      },
    },
  } as const;

  return {
    useTranslation: () => ({
      t: ((keyOrSelector: string | ((resources: typeof zhResources) => string)) => {
        if (typeof keyOrSelector === 'function') {
          return keyOrSelector(zhResources);
        }
        return keyOrSelector;
      }) as unknown,
      i18n: {
        language: 'zh',
        changeLanguage: vi.fn(),
      },
    }),
    initReactI18next: {
      type: '3rdParty',
      init: vi.fn(),
    },
  };
});

/**
 * AutoNamingSetting 组件单元测试
 *
 * 测试组件的渲染、用户交互、状态管理和国际化功能
 *
 * @component
 * @remarks
 * AutoNamingSetting 是设置页面的组件，负责管理自动命名开关。
 * 该组件主要包含：
 * - 显示自动命名开关
 * - 切换自动命名功能
 * - 显示功能说明
 */
describe('AutoNamingSetting', () => {
  /**
   * 测试辅助函数：创建带有 Redux store 的测试组件
   *
   * @param preloadedState - 预加载的 Redux 状态
   * @returns 渲染结果和 store 对象
   *
   * @example
   * ```ts
   * const { container, store } = setup({
   *   appConfig: { autoNamingEnabled: true }
   * });
   * ```
   */
  function setup(preloadedState = {}) {
    /**
     * 创建 Redux store
     * 配置 appConfig reducer 用于管理应用配置状态
     */
    const store = configureStore({
      reducer: {
        appConfig: appConfigReducer,
      },
      preloadedState,
    });

    /**
     * 渲染组件
     * 使用 Redux Provider 包裹组件以提供 store
     */
    const renderResult = render(
      <Provider store={store}>
        <AutoNamingSetting />
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
    cleanup();
  });

  /**
   * 组件渲染测试组
   *
   * 验证组件在不同状态下的正确渲染：
   * - 正常状态（开关开启）
   * - 正常状态（开关关闭）
   */
  describe('渲染', () => {
    /**
     * 测试用例：验证组件在开关开启状态下的渲染
     *
     * Given: 组件挂载且 autoNamingEnabled 为 true
     * When: 组件完成渲染
     * Then: 组件容器及其子元素应正确显示
     */
    it('应该正常渲染组件（开关开启状态）', () => {
      const { container } = setup({
        appConfig: {
          autoNamingEnabled: true,
        },
      });

      expect(container).toBeInTheDocument();
      expect(screen.getByText('自动命名')).toBeInTheDocument();
      expect(screen.getByText('自动为聊天生成标题，默认开启')).toBeInTheDocument();
    });

    /**
     * 测试用例：验证组件在开关关闭状态下的渲染
     *
     * Given: 组件挂载且 autoNamingEnabled 为 false
     * When: 组件完成渲染
     * Then: 组件容器及其子元素应正确显示
     */
    it('应该正常渲染组件（开关关闭状态）', () => {
      const { container } = setup({
        appConfig: {
          autoNamingEnabled: false,
        },
      });

      expect(container).toBeInTheDocument();
      expect(screen.getByText('自动命名')).toBeInTheDocument();
      expect(screen.getByText('自动为聊天生成标题，默认开启')).toBeInTheDocument();
    });

    /**
     * 测试用例：验证组件使用默认状态渲染
     *
     * Given: 组件挂载且使用默认状态（autoNamingEnabled 为 true）
     * When: 组件完成渲染
     * Then: 组件应显示开关开启状态
     */
    it('应该使用默认状态渲染（autoNamingEnabled = true）', () => {
      const { container } = setup();

      expect(container).toBeInTheDocument();
      expect(screen.getByText('自动命名')).toBeInTheDocument();
    });
  });

  /**
   * 用户交互测试组
   *
   * 验证用户与组件交互时的行为：
   * - 点击开关切换状态
   * - Redux store 正确更新
   */
  describe('用户交互', () => {
    /**
     * 测试用例：验证点击开关可以切换状态（从开启到关闭）
     *
     * Given: 组件挂载且 autoNamingEnabled 为 true
     * When: 用户点击开关
     * Then: Redux store 中的 autoNamingEnabled 应更新为 false
     */
    it('应该能够切换开关状态（从开启到关闭）', async () => {
      const { store } = setup({
        appConfig: {
          autoNamingEnabled: true,
        },
      });

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).toHaveAttribute('data-state', 'checked');

      await userEvent.click(switchElement);

      expect(store.getState().appConfig.autoNamingEnabled).toBe(false);
    });

    /**
     * 测试用例：验证点击开关可以切换状态（从关闭到开启）
     *
     * Given: 组件挂载且 autoNamingEnabled 为 false
     * When: 用户点击开关
     * Then: Redux store 中的 autoNamingEnabled 应更新为 true
     */
    it('应该能够切换开关状态（从关闭到开启）', async () => {
      const { store } = setup({
        appConfig: {
          autoNamingEnabled: false,
        },
      });

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');

      await userEvent.click(switchElement);

      expect(store.getState().appConfig.autoNamingEnabled).toBe(true);
    });
  });

  /**
   * 状态同步测试组
   *
   * 验证组件与 Redux store 的状态同步：
   * - 初始状态正确显示
   * - 状态变更后正确更新
   */
  describe('状态同步', () => {
    /**
     * 测试用例：验证初始开关状态正确显示
     *
     * Given: 组件挂载且 autoNamingEnabled 为 true
     * When: 组件完成渲染
     * Then: 开关应显示为 checked 状态
     */
    it('应该正确显示初始开关状态（开启）', () => {
      setup({
        appConfig: {
          autoNamingEnabled: true,
        },
      });

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });

    /**
     * 测试用例：验证初始开关状态正确显示
     *
     * Given: 组件挂载且 autoNamingEnabled 为 false
     * When: 组件完成渲染
     * Then: 开关应显示为 unchecked 状态
     */
    it('应该正确显示初始开关状态（关闭）', () => {
      setup({
        appConfig: {
          autoNamingEnabled: false,
        },
      });

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    });

    /**
     * 测试用例：验证连续快速点击开关后状态一致性
     *
     * Given: 组件挂载且 autoNamingEnabled 为 true
     * When: 用户连续快速点击开关两次
     * Then: Redux store 中的 autoNamingEnabled 应保持为 true
     */
    it('应该正确处理连续快速点击开关', async () => {
      const { store } = setup({
        appConfig: {
          autoNamingEnabled: true,
        },
      });

      const switchElement = screen.getByRole('switch');

      await userEvent.click(switchElement);
      await userEvent.click(switchElement);

      expect(store.getState().appConfig.autoNamingEnabled).toBe(true);
    });
  });
});
