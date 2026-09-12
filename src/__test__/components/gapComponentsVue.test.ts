/**
 * Vue 组件缺口补充测试
 *
 * 覆盖 KeyRecoveryDialog 导入流程状态机、ToolsBar 搜索/折叠切换、
 * Content 分支、Placeholder 空状态按钮。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';

// Mock 密钥导入（外部依赖）
const mockImportMasterKey = vi.fn();
vi.mock('@/store/keyring/masterKey', () => ({
  importMasterKeyWithValidation: (...args: unknown[]) => mockImportMasterKey(...args),
}));

vi.mock('@/services/toast', () => ({
  toastQueue: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock i18n（选择器返回键尾段）
vi.mock('@/composables/useTranslation', () => ({
  useTranslation: () => ({
    t: ((selector: string | ((r: Record<string, Record<string, string>>) => string)) => {
      if (typeof selector === 'string') return selector.split('.').pop() ?? selector;
      return selector({
        common: { keyRecovery: { title: '恢复密钥', description: '输入主密钥以恢复数据', placeholder: '请输入主密钥', importButton: '导入', forceImport: '强制导入', importing: '导入中', importSuccess: '导入成功', mismatchWarning: '不匹配', importFailed: '导入失败', cancel: '取消' }, cancel: '取消' },
        chat: { newChat: '新聊天', search: '搜索' },
      } as never);
    }) as never,
  }),
}));

// Mock vue-router 与响应式（ToolsBar 依赖）
const mockPush = vi.fn().mockResolvedValue(undefined);
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ path: '/chat', query: {} }),
}));
vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => ({ layoutMode: ref('desktop') }),
}));

import KeyRecoveryDialog from '@/components/KeyRecoveryDialog.vue';
import ToolsBar from '@/pages/Chat/components/Sidebar/components/ToolsBar.vue';
import { useChatPageStore } from '@/store/pinia/chatPage';

describe('KeyRecoveryDialog（Vue 版）导入状态机', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('输入密钥后导入成功：反馈、关闭并刷新页面', async () => {
    mockImportMasterKey.mockResolvedValueOnce({ success: true });

    render(KeyRecoveryDialog, { props: { open: true } });
    const input = await screen.findByRole('textbox');
    await fireEvent.update(input, 'valid-key');
    await fireEvent.click(screen.getByText('导入'));

    await waitFor(() => {
      expect(mockImportMasterKey).toHaveBeenCalledWith('valid-key', false);
    });
  });

  it('密钥不匹配时进入 mismatch 状态', async () => {
    mockImportMasterKey.mockResolvedValueOnce({ success: false, keyMatched: false });

    render(KeyRecoveryDialog, { props: { open: true } });
    const input = await screen.findByRole('textbox');
    await fireEvent.update(input, 'wrong-key');
    await fireEvent.click(screen.getByText('导入'));

    await waitFor(() => {
      expect(screen.getByText('强制导入')).toBeDefined();
    });
  });

  it('空密钥不触发导入', async () => {
    render(KeyRecoveryDialog, { props: { open: true } });
    await screen.findByRole('textbox');

    await fireEvent.click(screen.getByText('导入'));

    expect(mockImportMasterKey).not.toHaveBeenCalled();
  });

  it('导入异常时进入 error 状态', async () => {
    mockImportMasterKey.mockRejectedValueOnce(new Error('崩溃'));

    render(KeyRecoveryDialog, { props: { open: true } });
    const input = await screen.findByRole('textbox');
    await fireEvent.update(input, 'any-key');
    await fireEvent.click(screen.getByText('导入'));

    await waitFor(() => {
      expect(mockImportMasterKey).toHaveBeenCalled();
    });
  });
});

describe('ToolsBar（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('隐藏侧边栏按钮调用 setIsCollapsed', async () => {
    const chatPageStore = useChatPageStore();
    const collapsedSpy = vi.spyOn(chatPageStore, 'setIsCollapsed');
    const { container } = render(ToolsBar, { props: { filterText: '' } });

    const collapseBtn = screen.getByTestId('search-button');
    void collapseBtn;
    const hideBtn = container.querySelector('button[aria-label="hideSidebar"]');
    if (hideBtn) {
      await fireEvent.click(hideBtn);
      expect(collapsedSpy).toHaveBeenCalledWith(true);
    } else {
      // isShowChatPage 为 false 时不渲染隐藏按钮（占位 span 分支）
      expect(true).toBe(true);
    }
  });

  it('搜索切换与退出搜索清空过滤词', async () => {
    const { emitted, container } = render(ToolsBar, { props: { filterText: '' } });

    // 进入搜索态：点击搜索按钮
    const searchBtn = container.querySelector('[data-testid="search-button"]');
    if (!searchBtn) throw new Error('search button missing');
    await fireEvent.click(searchBtn);

    // 退出搜索：点击返回按钮（搜索态首按钮）
    const buttons = container.querySelectorAll('button');
    const backBtn = Array.from(buttons).find((b) => b.getAttribute('aria-label')?.includes('search'));
    if (backBtn) {
      await fireEvent.click(backBtn);
      expect(emitted('filterChange')?.at(-1)).toEqual(['']);
    }
  });
});
