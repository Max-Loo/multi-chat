/**
 * InitializationController 组件测试
 *
 * 验证进度初始值、onProgress 更新、成功/失败/无供应商三种终态
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import InitializationController from '@/components/InitializationController/InitializationController.vue';
import type { InitStep, InitResult } from '@/services/initialization';

// InitializationManager mock：runInitialization 行为由测试控制
const initMock = vi.hoisted(() => ({ runInitialization: vi.fn() }));

vi.mock('@/services/initialization', () => ({
  InitializationManager: class {
    runInitialization = initMock.runInitialization;
  },
}));

vi.mock('@/components/FatalErrorScreen', () => ({
  FatalErrorScreen: {
    props: ['errors'],
    template: '<div data-testid="fatal-error-stub">fatal:{{ errors.length }}</div>',
  },
}));

vi.mock('@/components/NoProvidersAvailable.vue', () => ({
  default: { template: '<div data-testid="no-providers-stub">no providers</div>' },
}));

vi.mock('@/components/AnimatedLogo', () => ({
  AnimatedLogo: { template: '<div data-testid="logo-stub" />' },
}));

/** 构造初始化步骤桩 */
function makeSteps(count: number): InitStep[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `step-${i}`,
  })) as unknown as InitStep[];
}

describe('InitializationController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初始渲染时进度应为 0%', async () => {
    initMock.runInitialization.mockImplementation(
      () => new Promise(() => {}), // 挂起，保持初始化中状态
    );

    render(InitializationController, { props: { initSteps: makeSteps(4) } });

    // fake timers 下 flush 微任务
    await vi.advanceTimersByTimeAsync(0);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('onProgress 回调应该更新进度百分比', async () => {
    initMock.runInitialization.mockImplementation(async ({ onProgress }) => {
      onProgress?.(2, 4, undefined);
      return { success: true, warnings: [] } as unknown as InitResult;
    });

    render(InitializationController, { props: { initSteps: makeSteps(4) } });

    await vi.advanceTimersByTimeAsync(600);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('初始化成功后应延迟触发 complete 事件', async () => {
    const onComplete = vi.fn();
    initMock.runInitialization.mockResolvedValue({
      success: true,
      warnings: [],
    } as unknown as InitResult);

    render(InitializationController, {
      props: { initSteps: makeSteps(2), onComplete },
    });

    await vi.advanceTimersByTimeAsync(400);
    expect(onComplete).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, warnings: [] }),
    );
  });

  it('初始化失败时应该渲染 FatalErrorScreen', async () => {
    initMock.runInitialization.mockResolvedValue({
      success: false,
      fatalErrors: [{ severity: 'fatal', message: '步骤失败' }],
      warnings: [],
    } as unknown as InitResult);

    render(InitializationController, { props: { initSteps: makeSteps(2) } });

    await vi.advanceTimersByTimeAsync(0);

    expect(screen.getByTestId('fatal-error-stub')).toHaveTextContent('fatal:1');
  });

  it('无可用供应商时应该渲染 NoProvidersAvailable', async () => {
    initMock.runInitialization.mockResolvedValue({
      success: true,
      warnings: [],
      modelProviderStatus: { isNoProvidersError: true },
    } as unknown as InitResult);

    render(InitializationController, { props: { initSteps: makeSteps(2) } });

    await vi.advanceTimersByTimeAsync(0);

    expect(screen.getByTestId('no-providers-stub')).toBeInTheDocument();
  });

  it('初始化中应该显示加载文本与动态省略号', async () => {
    initMock.runInitialization.mockImplementation(
      () => new Promise(() => {}),
    );

    render(InitializationController, { props: { initSteps: makeSteps(2) } });

    await vi.advanceTimersByTimeAsync(0);
    expect(screen.getByText(/Initializing application/)).toBeInTheDocument();

    // 200ms 后应追加一个点
    await vi.advanceTimersByTimeAsync(200);
    expect(screen.getByText('Initializing application.')).toBeInTheDocument();
  });

  it('真实定时器下成功完成应触发 complete（集成冒烟）', async () => {
    vi.useRealTimers();
    const onComplete = vi.fn();
    initMock.runInitialization.mockResolvedValue({
      success: true,
      warnings: [],
    } as unknown as InitResult);

    render(InitializationController, {
      props: { initSteps: makeSteps(2), onComplete },
    });

    await waitFor(() => expect(onComplete).toHaveBeenCalled(), { timeout: 3000 });
  });
});
