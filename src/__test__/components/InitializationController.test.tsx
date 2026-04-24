/**
 * InitializationController 组件单元测试
 *
 * 渲染完整组件树（FatalErrorScreen、NoProvidersAvailable 为真实组件），
 * 仅 mock 第三方 UI 组件 Progress 和 Canvas 动画组件 AnimatedLogo
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import * as InitializationModule from '@/services/initialization';
import { InitializationController } from '@/components/InitializationController';
import type { InitResult, InitConfig, InitStep } from '@/services/initialization';
import { asTestType } from '@/__test__/helpers/testing-utils';

// Mock Progress component（shadcn/ui 第三方 UI 组件，属于例外）
vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => (
    <div data-testid="progress" data-value={value}>
      Progress: {value}%
    </div>
  ),
}));

// Mock AnimatedLogo（Canvas 动画组件，happy-dom 不支持 Canvas 渲染）
vi.mock('@/components/AnimatedLogo', () => ({
  AnimatedLogo: () => <div data-testid="animated-logo">Logo</div>,
}));

// Mock lucide-react 图标（仅 mock InitializationController 不直接使用的图标，
// FatalErrorScreen 和 NoProvidersAvailable 的图标通过真实组件渲染）
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    AlertOctagon: () => <span data-testid="icon-alert-octagon">AlertOctagon</span>,
    AlertCircle: () => <span data-testid="icon-alert-circle">AlertCircle</span>,
  };
});

// Mock useResetDataDialog（FatalErrorScreen 依赖，内部调用 resetAllData 涉及浏览器 API）
vi.mock('@/hooks/useResetDataDialog', () => ({
  useResetDataDialog: () => ({
    setIsDialogOpen: vi.fn(),
    isResetting: false,
    renderResetDialog: () => null,
  }),
}));

// Mock KeyRecoveryDialog（FatalErrorScreen 依赖，内部调用 masterKey 加密模块）
vi.mock('@/components/KeyRecoveryDialog', () => ({
  KeyRecoveryDialog: () => null,
}));

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    common: {
      initializationFailed: '初始化失败',
      initializationFailedDescription: '初始化过程中遇到了无法恢复的错误',
      showErrorDetails: '查看错误详情',
      masterKeyRegeneratedImport: '重新生成主密钥并导入',
      resetAllData: '重置所有数据',
      refreshPage: '刷新页面',
      noProvidersAvailable: '无可用的模型供应商',
      noProvidersDescription: '应用无法连接到模型数据服务器，且本地无可用缓存。',
      noProvidersHint: '请检查网络连接后点击下方按钮重试。',
      reload: '重新加载',
    },
  }),
);

// 创建一个可控制的 mock runInitialization 函数
let mockRunInitialization: ReturnType<typeof vi.fn>;

// Mock initSteps
const mockInitSteps = [
  { name: 'step1', critical: true, execute: vi.fn(), onError: vi.fn() },
  { name: 'step2', critical: false, execute: vi.fn(), onError: vi.fn() },
] as unknown as InitStep[];

describe('InitializationController', () => {
  beforeEach(() => {
    mockRunInitialization = vi.fn();

    // Mock InitializationManager 类
    vi.spyOn(InitializationModule, 'InitializationManager').mockImplementation(
      asTestType<typeof InitializationModule.InitializationManager>(
        function (this: { runInitialization: typeof mockRunInitialization }) {
          this.runInitialization = mockRunInitialization;
          return this;
        }
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('进度初始值', () => {
    it('初始渲染时进度应为 0%', async () => {
      // 设置一个永远不会 resolve 的 promise，保持初始化状态
      mockRunInitialization.mockImplementation(() => new Promise<InitResult>(() => {}));

      const onComplete = vi.fn();
      render(<InitializationController initSteps={mockInitSteps} onComplete={onComplete} />);

      // 检查初始进度为 0%（使用 getAllBy 并检查第一个）
      const progressElements = screen.getAllByTestId('progress');
      expect(progressElements[0]).toHaveAttribute('data-value', '0');
    });

    it('初始渲染时应显示 0% 百分比文本', async () => {
      mockRunInitialization.mockImplementation(() => new Promise<InitResult>(() => {}));

      const onComplete = vi.fn();
      render(<InitializationController initSteps={mockInitSteps} onComplete={onComplete} />);

      // 检查百分比文本显示
      const percentageTexts = screen.getAllByText('0%');
      expect(percentageTexts.length).toBeGreaterThan(0);
    });
  });

  describe('onProgress 回调更新进度', () => {
    it('当步骤完成时应该更新进度', async () => {
      let progressCallback: ((current: number, total: number, step: string) => void) | undefined;

      mockRunInitialization.mockImplementation(async (config: InitConfig) => {
        progressCallback = config.onProgress;
        // 模拟长时间运行的初始化
        return new Promise<InitResult>(() => {});
      });

      const onComplete = vi.fn();
      render(<InitializationController initSteps={mockInitSteps} onComplete={onComplete} />);

      // 初始进度为 0%
      const initialProgress = screen.getAllByTestId('progress');
      expect(initialProgress[0]).toHaveAttribute('data-value', '0');

      // 模拟第一个步骤完成
      await act(async () => {
        if (progressCallback) {
          progressCallback(1, 2, 'step1');
        }
      });

      // 检查进度更新 - 使用 some() 因为 StrictMode 会渲染多个组件实例
      await waitFor(() => {
        const progressElements = screen.getAllByTestId('progress');
        const hasUpdatedProgress = progressElements.some(
          (el) => el.getAttribute('data-value') === '50'
        );
        expect(hasUpdatedProgress).toBe(true);
      });
    });
  });

  describe('百分比显示', () => {
    it('百分比应显示在进度条右侧', async () => {
      mockRunInitialization.mockImplementation(() => new Promise<InitResult>(() => {}));

      const onComplete = vi.fn();
      render(<InitializationController initSteps={mockInitSteps} onComplete={onComplete} />);

      // 检查百分比文本存在且有正确的样式类（text-right 表示右对齐）
      const percentageElements = screen.getAllByText('0%');
      expect(percentageElements.length).toBeGreaterThan(0);

      // 检查包含 text-right 类
      const rightAlignedPercentage = percentageElements.find((el) =>
        el.className.includes('text-right')
      );
      expect(rightAlignedPercentage).toBeDefined();
    });
  });

  describe('动态三个点动画', () => {
    it('初始化中应该显示加载文本', async () => {
      mockRunInitialization.mockImplementation(() => new Promise<InitResult>(() => {}));

      const onComplete = vi.fn();
      render(<InitializationController initSteps={mockInitSteps} onComplete={onComplete} />);

      // 检查存在加载文本
      const loadingTexts = screen.getAllByText((content) =>
        content.startsWith('Initializing application')
      );
      expect(loadingTexts.length).toBeGreaterThan(0);
    });
  });

  describe('onComplete 回调', () => {
    it('初始化成功时应该调用 onComplete 并传递正确的结果', async () => {
      const successResult: InitResult = {
        success: true,
        fatalErrors: [],
        warnings: [{ severity: 'warning', message: 'Test warning' }],
        ignorableErrors: [],
        completedSteps: ['step1', 'step2'],
      };

      mockRunInitialization.mockResolvedValue(successResult);

      const onComplete = vi.fn();
      render(<InitializationController initSteps={mockInitSteps} onComplete={onComplete} />);

      // 等待 onComplete 被调用（包括 500ms 延迟）
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          warnings: [{ severity: 'warning', message: 'Test warning' }],
        })
      );
    });
  });

  describe('错误状态渲染', () => {
    it('初始化失败时应该渲染 FatalErrorScreen（显示错误标题和错误消息）', async () => {
      const failureResult: InitResult = {
        success: false,
        fatalErrors: [{ severity: 'fatal', message: 'Critical error' }],
        warnings: [],
        ignorableErrors: [],
        completedSteps: [],
      };

      mockRunInitialization.mockResolvedValue(failureResult);

      const onComplete = vi.fn();
      render(<InitializationController initSteps={mockInitSteps} onComplete={onComplete} />);

      // 通过真实 FatalErrorScreen 的用户可见文本验证
      await waitFor(() => {
        expect(screen.getByText('初始化失败')).toBeInTheDocument();
      });

      // 验证错误消息内容
      expect(screen.getByText('Critical error')).toBeInTheDocument();
      // 验证刷新按钮存在
      expect(screen.getByRole('button', { name: '刷新页面' })).toBeInTheDocument();
      // 不应该调用 onComplete
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('无可用供应商时应该渲染 NoProvidersAvailable（显示提示文本和重新加载按钮）', async () => {
      const successResult: InitResult = {
        success: true,
        fatalErrors: [],
        warnings: [],
        ignorableErrors: [],
        completedSteps: ['step1', 'step2'],
        // 通过 modelProviderStatus 传递状态
        modelProviderStatus: {
          hasError: true,
          isNoProvidersError: true,
        },
      };

      mockRunInitialization.mockResolvedValue(successResult);

      const onComplete = vi.fn();
      render(<InitializationController initSteps={mockInitSteps} onComplete={onComplete} />);

      // 通过真实 NoProvidersAvailable 的用户可见文本验证
      await waitFor(() => {
        expect(screen.getByText('无可用的模型供应商')).toBeInTheDocument();
      });

      // 验证提示文本和按钮
      expect(screen.getByText('应用无法连接到模型数据服务器，且本地无可用缓存。')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument();
      // 不应该调用 onComplete
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
