/**
 * 主密钥恢复功能集成测试（Vue 版）
 *
 * 测试范围：
 * - FatalErrorScreen 重置按钮交互（渲染 → 点击 → 确认 → resetAllData 调用）
 * - 密钥导入流程（错误密钥不匹配警告 → 强制导入 → 成功后刷新）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { FatalErrorScreen } from '@/components/FatalErrorScreen';
import type { InitError } from '@/services/initialization';
import {
  initializeMasterKey,
  storeMasterKey,
  getMasterKey,
} from '@/store/keyring/masterKey';
import { clearBrowserStorage } from './helpers';

// Mock resetAllData
const resetAllDataMock = vi.hoisted(() => vi.fn());

vi.mock('@/utils/resetAllData', () => ({
  resetAllData: resetAllDataMock,
}));

// Mock 页面刷新
const reloadMock = vi.hoisted(() => vi.fn());

vi.stubGlobal('location', { ...window.location, reload: reloadMock });

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      common: {
        initializationFailed: '初始化失败',
        initializationFailedDescription: '应用初始化过程中发生错误',
        refreshPage: '刷新页面',
        showErrorDetails: '显示错误详情',
        resetAllData: '重置所有数据并重新开始',
        resetConfirmTitle: '确认重置所有数据',
        resetConfirmDescription: '将清除所有已保存的模型配置和聊天记录',
        resetConfirmAction: '确认重置',
        masterKeyRegeneratedImport: '导入密钥',
        cancel: '取消',
        keyRecovery: {
          title: '导入密钥',
          description: '输入您的备份密钥以恢复加密数据',
          placeholder: '请输入 64 字符的 hex 编码密钥',
          importButton: '导入',
          importing: '导入中...',
          importSuccess: '密钥导入成功',
          securityWarning: '密钥是敏感信息',
          mismatchWarning: '导入的密钥无法解密现有数据',
          importFailed: '密钥导入失败',
          forceImport: '仍然导入',
        },
      },
    }).useTranslation(),
}));

// Toast mock（导入成功提示）
const toastMock = vi.hoisted(() => ({
  toastQueue: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('@/services/toast', () => toastMock);

/** 构造主密钥步骤的致命错误 */
function makeMasterKeyError(): InitError {
  return {
    severity: 'fatal',
    message: '主密钥初始化失败',
    stepName: 'masterKey',
  } as InitError;
}

describe('主密钥恢复功能集成测试', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetAllDataMock.mockResolvedValue(undefined);
    await clearBrowserStorage();
    setActivePinia(createPinia());
  });

  it('masterKey 错误时应该提供导入密钥入口', () => {
    render(FatalErrorScreen, { props: { errors: [makeMasterKeyError()] } });

    expect(
      screen.getByRole('button', { name: '导入密钥' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '重置所有数据并重新开始' }),
    ).toBeInTheDocument();
  });

  it('重置按钮交互：点击 → 对话框 → 确认 → resetAllData 调用', async () => {
    render(FatalErrorScreen, { props: { errors: [makeMasterKeyError()] } });
    await nextTick();

    // 打开重置对话框
    await fireEvent.click(
      screen.getByRole('button', { name: '重置所有数据并重新开始' }),
    );
    await nextTick();

    // 确认重置
    const dialog = await screen.findByRole('alertdialog');
    const confirmBtn = [...dialog.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('确认重置'),
    );
    await fireEvent.click(confirmBtn!);

    await waitFor(() => {
      expect(resetAllDataMock).toHaveBeenCalledTimes(1);
    });
  });

  it('密钥导出后重新写入 → 读回一致（导出/导入数据基础）', async () => {
    await initializeMasterKey();
    const originalKey = await getMasterKey();
    expect(originalKey).toMatch(/^[0-9a-f]{64}$/);

    // 模拟用户备份再恢复：重新写入同一密钥
    await storeMasterKey(originalKey!);
    const restoredKey = await getMasterKey();
    expect(restoredKey).toBe(originalKey);
  });

  it('密钥导入对话框：空输入禁用导入，不匹配密钥显示警告与二次确认', async () => {
    await initializeMasterKey();
    // 写入一条加密模型数据（verifyMasterKey 通过解密模型 API Key 验证密钥）
    const { useModelsStore } = await import('@/store/models');
    setActivePinia(createPinia());
    const modelsStore = useModelsStore();
    await modelsStore.createModel({
      model: {
        id: 'model-verify',
        nickname: '验证模型',
        providerKey: 'deepseek',
        providerName: 'DeepSeek',
        modelName: 'deepseek-chat',
        modelKey: 'deepseek-chat',
        apiKey: 'sk-verify-secret',
        apiAddress: 'https://api.deepseek.com',
        createdAt: '2026-01-01 00:00:00',
        updateAt: '2026-01-01 00:00:00',
        isEnable: true,
        isDeleted: false,
        remark: '',
      } as never,
    });

    render(FatalErrorScreen, { props: { errors: [makeMasterKeyError()] } });
    await nextTick();

    // 打开导入对话框
    await fireEvent.click(screen.getByRole('button', { name: '导入密钥' }));
    await nextTick();

    const input = screen.getByPlaceholderText('请输入 64 字符的 hex 编码密钥');
    expect(screen.getByRole('button', { name: '导入' })).toBeDisabled();

    // 输入一个有效的 64 位 hex 密钥（无法解密现有数据 → mismatch 分支）
    const foreignKey = 'b'.repeat(64);
    await fireEvent.update(input, foreignKey);
    expect(screen.getByRole('button', { name: '导入' })).toBeEnabled();

    await fireEvent.click(screen.getByRole('button', { name: '导入' }));

    await waitFor(
      () => {
        // 密钥不匹配时显示警告与二次确认
        expect(
          screen.getByText('导入的密钥无法解密现有数据'),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '仍然导入' })).toBeInTheDocument();
      },
      { timeout: 8000 },
    );
  });
});
