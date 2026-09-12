/**
 * Vue GeneralSetting 页测试（集成：语言 / 自动命名 / 供应商 / 导出）
 *
 * 行为基线与迁移前 React 版一致：
 * - 渲染四个设置区块与滚动容器
 * - 导出已删除聊天为空时提示且不下载
 * - 自动命名开关持久化到 localStorage
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    common: { language: '语言' },
    setting: {
      autoNaming: { title: '自动命名', description: '自动为聊天生成标题，默认开启' },
      modelProvider: { title: '模型供应商', description: '管理模型供应商', refreshButton: '刷新模型供应商' },
      chatExport: {
        title: '聊天导出',
        description: '导出聊天数据为 JSON 文件',
        exportAll: '导出所有聊天',
        exportDeleted: '导出已删除聊天',
        exportSuccess: '导出成功',
        exportFailed: '导出失败',
        noDeletedChats: '没有已删除的聊天',
      },
    },
  }));

vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

vi.mock('@/services/chatExport', () => ({
  exportAllChats: vi.fn().mockResolvedValue({ chats: [], exportedAt: '', version: '' }),
  exportDeletedChats: vi.fn().mockResolvedValue({ chats: [], exportedAt: '', version: '' }),
}));

import GeneralSetting from '@/pages/Setting/components/GeneralSetting.vue';
import { exportDeletedChats } from '@/services/chatExport';
import { toastQueue } from '@/services/toast';
import { useAppConfigStore } from '@/store/pinia/appConfig';
import { LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY } from '@/utils/constants';

describe('GeneralSetting（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('渲染测试', () => {
    it('渲染语言设置区域', () => {
      render(GeneralSetting);

      expect(screen.getByText('语言')).toBeVisible();
    });

    it('渲染自动命名设置区域', () => {
      render(GeneralSetting);

      expect(screen.getByText('自动命名')).toBeVisible();
      expect(screen.getByText('自动为聊天生成标题，默认开启')).toBeVisible();
    });

    it('渲染模型供应商设置区域', () => {
      render(GeneralSetting);

      expect(screen.getByText('刷新模型供应商')).toBeVisible();
    });

    it('渲染聊天导出区域', () => {
      render(GeneralSetting);

      expect(screen.getByText('导出所有聊天')).toBeVisible();
      expect(screen.getByText('导出已删除聊天')).toBeVisible();
    });
  });

  describe('滚动测试', () => {
    it('渲染滚动容器且触发滚动不崩溃', async () => {
      render(GeneralSetting);

      const scrollContainer = screen.getByTestId('scroll-container');
      expect(scrollContainer).toBeVisible();

      await fireEvent.scroll(scrollContainer);
    });
  });

  describe('自动命名开关', () => {
    it('切换开关后持久化到 localStorage', async () => {
      render(GeneralSetting);
      const store = useAppConfigStore();
      expect(store.autoNamingEnabled).toBe(true);

      const sw = screen.getByRole('switch');
      await fireEvent.click(sw);

      expect(store.autoNamingEnabled).toBe(false);
      expect(localStorage.getItem(LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY)).toBe('false');
    });
  });

  describe('聊天导出', () => {
    it('导出已删除聊天为空时提示用户且不触发下载', async () => {
      vi.mocked(exportDeletedChats).mockResolvedValueOnce({
        chats: [],
        exportedAt: '2024-01-01',
        version: '1.0',
      } as never);
      const createObjectURL = vi.fn();
      vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });

      render(GeneralSetting);

      await fireEvent.click(screen.getByText('导出已删除聊天'));

      await vi.waitFor(() => {
        expect(exportDeletedChats).toHaveBeenCalled();
        expect(toastQueue.info).toHaveBeenCalledWith('没有已删除的聊天');
      });
      expect(createObjectURL).not.toHaveBeenCalled();
      expect(toastQueue.success).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });
});
