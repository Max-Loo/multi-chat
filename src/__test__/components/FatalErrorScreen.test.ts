/**
 * FatalErrorScreen 组件测试
 *
 * 验证错误列表渲染、刷新交互与主密钥错误时的恢复入口
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import { FatalErrorScreen } from '@/components/FatalErrorScreen';
import type { InitError } from '@/services/initialization';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      common: {
        initializationFailed: '初始化失败',
        initializationFailedDescription: '应用初始化过程中发生错误',
        refreshPage: '刷新页面',
        showErrorDetails: '显示错误详情',
        resetAllData: '重置所有数据并重新开始',
        masterKeyRegeneratedImport: '导入密钥',
      },
    }).useTranslation(),
}));

// 重置数据对话框 mock（重置流程由自身测试覆盖）
vi.mock('@/components/ResetDataDialog.vue', () => ({
  default: { template: '<div data-testid="reset-dialog-stub" />' },
}));

// 密钥恢复对话框 mock
vi.mock('@/components/KeyRecoveryDialog', () => ({
  KeyRecoveryDialog: { template: '<div data-testid="recovery-dialog-stub" />' },
}));

/** 构造初始化错误对象 */
function makeError(overrides: Partial<InitError> = {}): InitError {
  return {
    stepName: 'model',
    message: '步骤执行失败',
    severity: 'fatal',
    originalError: undefined,
    ...overrides,
  } as InitError;
}

describe('FatalErrorScreen 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该显示错误标题和错误消息', () => {
    render(FatalErrorScreen, { props: { errors: [makeError()] } });

    expect(screen.getByText('初始化失败')).toBeInTheDocument();
    expect(screen.getByText('步骤执行失败')).toBeInTheDocument();
  });

  it('应该为每个错误渲染独立的 Alert', () => {
    render(FatalErrorScreen, {
      props: {
        errors: [
          makeError({ message: '错误一' }),
          makeError({ message: '错误二' }),
        ],
      },
    });

    expect(screen.getByText('错误一')).toBeInTheDocument();
    expect(screen.getByText('错误二')).toBeInTheDocument();
  });

  it('点击刷新按钮应该调用 window.location.reload', async () => {
    const reloadSpy = vi
      .spyOn(window.location, 'reload')
      .mockImplementation(() => {});

    render(FatalErrorScreen, { props: { errors: [makeError()] } });

    await fireEvent.click(screen.getByRole('button', { name: '刷新页面' }));

    expect(reloadSpy).toHaveBeenCalled();
    reloadSpy.mockRestore();
  });

  it('masterKey 步骤错误时应该显示导入密钥按钮', () => {
    render(FatalErrorScreen, {
      props: {
        errors: [makeError({ stepName: 'masterKey', message: '主密钥初始化失败' })],
      },
    });

    expect(
      screen.getByRole('button', { name: '导入密钥' }),
    ).toBeInTheDocument();
  });

  it('非 masterKey 错误时不应显示导入密钥按钮', () => {
    render(FatalErrorScreen, { props: { errors: [makeError()] } });

    expect(
      screen.queryByRole('button', { name: '导入密钥' }),
    ).not.toBeInTheDocument();
  });

  it('应该始终提供重置数据入口', () => {
    render(FatalErrorScreen, { props: { errors: [makeError()] } });

    expect(
      screen.getByRole('button', { name: '重置所有数据并重新开始' }),
    ).toBeInTheDocument();
  });

  it('生产环境不显示错误详情（无 originalError 展开区）', () => {
    vi.stubEnv('DEV', false);

    render(FatalErrorScreen, {
      props: {
        errors: [makeError({ originalError: new Error('boom') })],
      },
    });

    expect(screen.queryByText('显示错误详情')).not.toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it('开发模式下有原始错误时显示错误详情入口', () => {
    vi.stubEnv('DEV', true);

    render(FatalErrorScreen, {
      props: {
        errors: [makeError({ originalError: new Error('boom') })],
      },
    });

    expect(screen.getByText('显示错误详情')).toBeInTheDocument();
    vi.unstubAllEnvs();
  });
});
