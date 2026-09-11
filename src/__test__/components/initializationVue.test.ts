/**
 * Vue 初始化流程集成测试
 *
 * mock InitializationManager，验证 InitializationController：
 * - 初始化成功 → 500ms 延迟后通知父组件
 * - 致命错误 → 渲染 FatalErrorScreen
 * - 无可用供应商 → 渲染 NoProvidersAvailable
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 可控的 runInitialization 实现（模块级注入，避免跨用例 spy 状态污染）
const runInitializationMock = vi.hoisted(() => ({
  impl: undefined as ((...args: unknown[]) => Promise<unknown>) | undefined,
}));

vi.mock('@/services/initialization', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/initialization')>();
  class MockInitializationManager {
    runInitialization(...args: unknown[]) {
      return runInitializationMock.impl!(...args);
    }
  }
  return {
    ...actual,
    InitializationManager: MockInitializationManager,
  };
});
import { render, screen, waitFor, cleanup } from '@testing-library/vue';
import InitializationControllerVue from '@/components/InitializationController.vue';
import type { InitResult } from '@/services/initialization';

// Mock 动画 Canvas（happy-dom 无 2D 上下文）
vi.mock('@/components/AnimatedLogo/AnimatedLogo.vue', () => ({
  default: { template: '<div data-testid="logo-placeholder" />' },
}));

const setInitResult = (result: InitResult) => {
  runInitializationMock.impl = vi.fn().mockResolvedValue(result) as unknown as (...args: unknown[]) => Promise<unknown>;
};

const successResult: InitResult = {
  success: true,
  fatalErrors: [],
  warnings: [],
  ignorableErrors: [],
  completedSteps: [],
};

describe('Vue 初始化流程', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('初始化成功后延迟通知父组件完成', async () => {
    setInitResult(successResult);

    const { emitted } = render(InitializationControllerVue, {
      props: { initSteps: [{ name: 'step1', run: vi.fn() }] as never },
    });

    // 初始化中显示进度 UI
    expect(screen.getByRole('status')).toBeVisible();

    // 等待 500ms 延迟 + 完成通知
    await waitFor(
      () => {
        expect(emitted('complete')).toBeTruthy();
      },
      { timeout: 2000 },
    );

    expect((emitted('complete')![0] as unknown[])[0]).toMatchObject({ success: true });
  });

  it('致命错误时渲染 FatalErrorScreen', async () => {
    setInitResult({
      success: false,
      fatalErrors: [{ stepName: 'masterKey' as const, message: '密钥初始化失败', originalError: null }],
      warnings: [],
      ignorableErrors: [],
      completedSteps: [],
    } as unknown as InitResult);

    render(InitializationControllerVue, {
      props: { initSteps: [{ name: 'step1', run: vi.fn() }] as never },
    });

    await waitFor(() => {
      expect(screen.getByTestId('fatal-error-screen')).toBeVisible();
    });
  });

  it('无可用供应商时渲染 NoProvidersAvailable', async () => {
    setInitResult({
      ...successResult,
      modelProviderStatus: { isNoProvidersError: true },
    } as InitResult);

    render(InitializationControllerVue, {
      props: { initSteps: [{ name: 'step1', run: vi.fn() }] as never },
    });

    await waitFor(() => {
      expect(screen.getByTestId('no-providers-container')).toBeVisible();
    });
  });
});
