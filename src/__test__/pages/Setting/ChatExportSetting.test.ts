/**
 * ChatExportSetting 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Setting/ChatExportSetting.test.tsx，保留核心语义：
 * - 导出全部聊天：触发下载 + 成功 toast
 * - 导出失败：错误 toast + loading 恢复
 * - 导出已删除聊天：有数据下载、无数据 info toast
 * - 导出中禁用两个按钮
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import { nextTick } from 'vue';

const mocks = vi.hoisted(() => ({
  exportAllChats: vi.fn(),
  exportDeletedChats: vi.fn(),
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
}));

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

vi.mock('@/services/chatExport', () => ({
  exportAllChats: (...args: unknown[]) => mocks.exportAllChats(...(args as [])),
  exportDeletedChats: (...args: unknown[]) =>
    mocks.exportDeletedChats(...(args as [])),
}));

vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

import ChatExportSetting from '@/pages/Setting/components/GeneralSetting/components/ChatExportSetting.vue';
import { toastQueue } from '@/services/toast';

// happy-dom 无 URL.createObjectURL
URL.createObjectURL =
  mocks.createObjectURL as unknown as typeof URL.createObjectURL;
URL.revokeObjectURL =
  mocks.revokeObjectURL as unknown as typeof URL.revokeObjectURL;

/** 渲染 ChatExportSetting（无 Pinia 依赖） */
function renderExport() {
  return render(ChatExportSetting);
}

describe('ChatExportSetting（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该触发下载并显示成功 toast 当导出成功', async () => {
    mocks.exportAllChats.mockResolvedValue({ chats: [{ id: '1' }] });
    renderExport();

    await fireEvent.click(screen.getByText('导出活跃聊天'));
    await vi.waitFor(() => {
      expect(mocks.createObjectURL).toHaveBeenCalled();
    });

    expect(toastQueue.success).toHaveBeenCalledWith('聊天数据导出成功');
  });

  it('应该显示错误 toast 并恢复 loading 当导出失败', async () => {
    mocks.exportAllChats.mockRejectedValue(new Error('export failed'));
    renderExport();

    await fireEvent.click(screen.getByText('导出活跃聊天'));
    await vi.waitFor(() => {
      expect(toastQueue.error).toHaveBeenCalledWith('导出聊天数据失败');
    });

    // loading 恢复：按钮重新可用
    await vi.waitFor(() => {
      expect(screen.getByText('导出活跃聊天')).not.toBeDisabled();
    });
  });

  it('应该触发下载并显示成功 toast 当有已删除聊天', async () => {
    mocks.exportDeletedChats.mockResolvedValue({
      chats: [{ id: '1', isDeleted: true }],
    });
    renderExport();

    await fireEvent.click(screen.getByText('导出已删除聊天'));
    await vi.waitFor(() => {
      expect(mocks.createObjectURL).toHaveBeenCalled();
    });

    expect(toastQueue.success).toHaveBeenCalledWith('聊天数据导出成功');
  });

  it('应该显示 info toast 且不触发下载 当已删除聊天为空', async () => {
    mocks.exportDeletedChats.mockResolvedValue({ chats: [] });
    renderExport();

    await fireEvent.click(screen.getByText('导出已删除聊天'));
    await vi.waitFor(() => {
      expect(toastQueue.info).toHaveBeenCalledWith('没有可导出的已删除聊天');
    });

    expect(mocks.createObjectURL).not.toHaveBeenCalled();
  });

  it('应该禁用两个按钮 当导出请求进行中', async () => {
    // 挂起的导出 Promise（对象包装规避 TS 控制流收窄）
    const pending: { resolve: (() => void) | null } = { resolve: null };
    mocks.exportAllChats.mockReturnValue(
      new Promise<void>((resolve) => {
        pending.resolve = resolve;
      }),
    );
    renderExport();

    await fireEvent.click(screen.getByText('导出活跃聊天'));
    await nextTick();

    expect(screen.getByText('导出活跃聊天')).toBeDisabled();
    expect(screen.getByText('导出已删除聊天')).toBeDisabled();

    // 收尾
    pending.resolve?.();
  });
});
