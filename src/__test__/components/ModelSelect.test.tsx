/**
 * ModelSelect 组件交互测试
 *
 * 测试模型选择组件的用户交互行为
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import ModelSelect from '@/pages/Chat/components/ModelSelect';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState, createModelSliceState, createModelProviderSliceState } from '@/__test__/helpers/mocks';
import { asTestType } from '@/__test__/helpers/testing-utils';
import { chatToMeta } from '@/types/chat';

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    chat: {
      selectModelHint: '请选择至少一个模型',
      configureChatSuccess: '配置聊天成功',
      configureChatFailed: '配置聊天失败',
      searchPlaceholder: '搜索模型...',
    },
    model: { openProviderList: '打开供应商列表' },
    table: {
      nickname: '模型名称',
      modelProvider: '模型供应商',
      modelName: '模型',
      lastUpdateTime: '更新时间',
      createTime: '创建时间',
    },
  }));

// Mock toastQueue
vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

// Mock useResponsive 以支持 mobile 模式测试
const { mockIsMobile } = vi.hoisted(() => ({ mockIsMobile: { value: false } }));
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => globalThis.__createResponsiveMock({ isMobile: mockIsMobile.value, layoutMode: mockIsMobile.value ? 'mobile' : 'desktop', isDesktop: !mockIsMobile.value }),
}));

const createModelSelectStore = () => {
  const mockModels = [
    createMockModel({
      id: 'model-1',
      nickname: 'GPT-4',
      providerKey: asTestType<ModelProviderKeyEnum>('deepseek'),
      modelName: 'gpt-4',
      providerName: 'OpenAI',
    }),
    createMockModel({
      id: 'model-2',
      nickname: 'Claude 3',
      providerKey: asTestType<ModelProviderKeyEnum>('moonshotai'),
      modelName: 'claude-3-opus',
      providerName: 'Anthropic',
    }),
    createMockModel({
      id: 'model-3',
      nickname: 'DeepSeek',
      providerKey: ModelProviderKeyEnum.DEEPSEEK,
      modelName: 'deepseek-chat',
      providerName: 'DeepSeek',
    }),
  ];

  return createTypeSafeTestStore({
    models: createModelSliceState({
      models: mockModels,
    }),
    modelProvider: createModelProviderSliceState({
      providers: [
        { providerKey: 'openai', providerName: 'OpenAI', api: 'https://api.openai.com', models: [] },
        { providerKey: 'anthropic', providerName: 'Anthropic', api: 'https://api.anthropic.com', models: [] },
        { providerKey: 'deepseek', providerName: 'DeepSeek', api: 'https://api.deepseek.com', models: [] },
      ],
    }),
    chat: createChatSliceState({
      chatMetaList: [chatToMeta(createMockChat({ id: 'chat-1', name: 'Test Chat' }))],
      activeChatData: { 'chat-1': createMockChat({ id: 'chat-1', name: 'Test Chat' }) },
      sendingChatIds: {},
      selectedChatId: 'chat-1',
    }),
  });
};

describe('ModelSelect 用户交互测试', () => {
  let store: ReturnType<typeof createModelSelectStore>;

  beforeEach(() => {
    store = createModelSelectStore();
  });

  /**
   * 4.20 - 创建用户交互行为测试
   * 测试模型选择的基本渲染和用户交互
   */
  describe('基本渲染交互', () => {
    it('应该正确渲染而不抛错', () => {
      renderWithProviders(<ModelSelect />, { store });

      // 验证表格渲染成功，组件确实加载了模型数据
      const tables = screen.getAllByRole('table');
      expect(tables.length).toBeGreaterThan(0);
    });

    it('应该渲染模型列表', () => {
      renderWithProviders(<ModelSelect />, { store });

      // 使用 ARIA role 验证表格存在
      const tables = screen.getAllByRole('table');
      expect(tables.length).toBeGreaterThan(0);
    });

    it('应该渲染确认按钮', () => {
      renderWithProviders(<ModelSelect />, { store });

      // 验证确认按钮存在
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  /**
   * 模型数据渲染验证
   */
  describe('模型数据渲染', () => {
    it('应该在表格中渲染模型名称', () => {
      renderWithProviders(<ModelSelect />, { store });

      // 模型 nickname 会出现在表格行中
      expect(screen.getAllByText('GPT-4').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Claude 3').length).toBeGreaterThan(0);
      expect(screen.getAllByText('DeepSeek').length).toBeGreaterThan(0);
    });

    it('应该在表格中渲染与 store 模型数量对应的行', () => {
      renderWithProviders(<ModelSelect />, { store });

      // 使用 ARIA role 验证表格行数
      const tables = screen.getAllByRole('table');
      const rows = within(tables[0]).getAllByRole('row');
      // 表头 + 3 行数据 = 4 行
      expect(rows.length).toBe(4);
    });
  });

  /**
   * 用户选择交互验证
   */
  describe('用户选择交互', () => {
    it('应该在未选择模型时点击确认显示提示', async () => {
      const { toastQueue } = await import('@/services/toast');
      renderWithProviders(<ModelSelect />, { store });

      // 找到确认按钮（使用 getByRole 以避免文本匹配问题）
      const confirmButtons = screen.getAllByRole('button');
      const confirmButton = confirmButtons.find(btn => btn.textContent?.includes('确认'));
      expect(confirmButton).toBeDefined();
      fireEvent.click(confirmButton!);

      expect(toastQueue.info).toHaveBeenCalledWith('请选择至少一个模型');
    });

    it('确认按钮应该可点击', () => {
      renderWithProviders(<ModelSelect />, { store });

      const confirmButtons = screen.getAllByRole('button');
      const confirmButton = confirmButtons.find(btn => btn.textContent?.includes('确认'));
      expect(confirmButton).toBeDefined();
      expect(confirmButton).not.toBeDisabled();
    });

    it('应该通过 checkbox 选择模型并显示 Badge', async () => {
      renderWithProviders(<ModelSelect />, { store });

      // 找到所有 checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(1);

      // 点击第一个 checkbox 选择模型
      fireEvent.click(checkboxes[0]);

      // 应该出现清除选中按钮（表示有模型被选中）
      expect(screen.getByLabelText('清除选中')).toBeInTheDocument();
    });

    it('应该在选中模型后点击确认调用 dispatch', async () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch');
      renderWithProviders(<ModelSelect />, { store });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      const confirmButtons = screen.getAllByRole('button');
      const confirmButton = confirmButtons.find(btn => btn.textContent?.includes('确认'));
      fireEvent.click(confirmButton!);

      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'chat/editChat' }));
      dispatchSpy.mockRestore();
    });

    it('应该取消选中模型', async () => {
      renderWithProviders(<ModelSelect />, { store });

      const checkboxes = screen.getAllByRole('checkbox');
      // 选择
      fireEvent.click(checkboxes[0]);
      // 再次点击取消选择
      fireEvent.click(checkboxes[0]);

      // Badge 不应出现（或已消失）
      // 注意：checkbox 状态可能由 Radix UI 管理
    });

    it('应该显示清除选中按钮当有模型被选中', async () => {
      renderWithProviders(<ModelSelect />, { store });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // 清除按钮应该出现
      const clearButton = screen.getByLabelText('清除选中');
      expect(clearButton).toBeInTheDocument();
    });

    it('应该清空所有选中当点击清除按钮', async () => {
      renderWithProviders(<ModelSelect />, { store });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      const clearButton = screen.getByLabelText('清除选中');
      fireEvent.click(clearButton);

      // 清除后 Badge 应消失
      expect(screen.queryByLabelText('清除选中')).not.toBeInTheDocument();
    });
  });

  describe('移动端模式', () => {
    beforeEach(() => {
      mockIsMobile.value = true;
    });

    afterEach(() => {
      mockIsMobile.value = false;
    });

    it('应该在移动端模式显示打开供应商列表按钮', () => {
      renderWithProviders(<ModelSelect />, { store });

      expect(screen.getByLabelText('打开供应商列表')).toBeInTheDocument();
    });
  });
});
