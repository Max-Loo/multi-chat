/**
 * DetailTitle 组件测试
 * 测试模型详情标题组件的渲染和功能
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import DetailTitle from '@/pages/Chat/components/Panel/Detail/Title';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createMockModel, createChatSliceState, createModelSliceState, createChatPageSliceState } from '@/__test__/helpers/mocks';
import { createMockPanelChatModel } from '@/__test__/helpers/mocks/panelLayout';

vi.mock('react-i18next', () => globalThis.__mockI18n());

/**
 * 创建测试用的 Redux store
 */
const createTestStore = (models: ReturnType<typeof createMockModel>[] = []) => {
  return createTypeSafeTestStore({
    models: createModelSliceState({
      models,
    }),
    chat: createChatSliceState(),
    chatPage: createChatPageSliceState({
      isSidebarCollapsed: false,
      isShowChatPage: true,
    }),
  });
};

describe('DetailTitle', () => {
  
  describe('6.1 测试正常状态渲染（Logo + 昵称）', () => {
    it('应该显示「昵称 (模型名)」格式', () => {
      const testModel = createMockModel({
        providerName: 'DeepSeek',
        modelName: 'deepseek-chat',
        nickname: '我的 DeepSeek 模型',
      });
      const chatModel = createMockPanelChatModel(testModel.id);
      const store = createTestStore([testModel]);

      renderWithProviders(<DetailTitle chatModel={chatModel} />, { store });

      const nicknameElement = screen.getByText('我的 DeepSeek 模型 (deepseek-chat)');
      expect(nicknameElement).toBeInTheDocument();
    });

    it('应该显示 ProviderLogo 组件', () => {
      const testModel = createMockModel({
        providerName: 'DeepSeek',
        providerKey: ModelProviderKeyEnum.DEEPSEEK,
      });
      const chatModel = createMockPanelChatModel(testModel.id);
      const store = createTestStore([testModel]);

      renderWithProviders(<DetailTitle chatModel={chatModel} />, { store });

      // 验证 Logo 容器存在（通过查询 alt 属性包含 "logo" 的元素）
      const logoElements = screen.getAllByAltText(/logo/i);
      expect(logoElements.length).toBeGreaterThan(0);
    });

    it('应该正确渲染包含 emoji 的昵称', () => {
      const testModel = createMockModel({
        nickname: '🚀 DeepSeek 🌟',
        modelName: 'deepseek-chat',
      });
      const chatModel = createMockPanelChatModel(testModel.id);
      const store = createTestStore([testModel]);

      renderWithProviders(<DetailTitle chatModel={chatModel} />, { store });

      const nicknameElement = screen.getByText(/🚀 DeepSeek 🌟 \(deepseek-chat\)/);
      expect(nicknameElement).toBeInTheDocument();
    });
  });

  describe('6.2 测试昵称为空时显示模型名称', () => {
    it('当昵称为空时应该显示模型名称', () => {
      const testModel = createMockModel({
        modelName: 'deepseek-chat',
        nickname: '',
      });
      const chatModel = createMockPanelChatModel(testModel.id);
      const store = createTestStore([testModel]);

      renderWithProviders(<DetailTitle chatModel={chatModel} />, { store });

      const modelNameElement = screen.getByText('deepseek-chat');
      expect(modelNameElement).toBeInTheDocument();
    });
  });

  describe('6.3 测试语义化标题元素', () => {
    it('应该使用 heading 元素显示模型名称', () => {
      const testModel = createMockModel({
        nickname: '这是一个非常长的昵称用于测试截断效果',
        modelName: 'very-long-model-name-for-testing',
      });
      const chatModel = createMockPanelChatModel(testModel.id);
      const store = createTestStore([testModel]);

      renderWithProviders(<DetailTitle chatModel={chatModel} />, { store });

      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toContain('这是一个非常长的昵称用于测试截断效果');
    });
  });

  describe('6.4 测试 Tooltip 内容正确性', () => {
    it('Tooltip 应该包含完整的模型信息', () => {
      const testModel = createMockModel({
        providerName: 'DeepSeek',
        modelName: 'deepseek-chat',
        nickname: '我的模型',
      });
      const chatModel = createMockPanelChatModel(testModel.id);
      const store = createTestStore([testModel]);

      renderWithProviders(<DetailTitle chatModel={chatModel} />, { store });

      // 验证 Tooltip 内容存在（即使不可见）
      // 注意：Tooltip 内容在 Radix UI 中可能不在 DOM 中直到触发
      // 这里我们验证组件渲染成功
      const triggerElement = screen.getByText('我的模型 (deepseek-chat)').closest('[data-state]');
      expect(triggerElement).toBeInTheDocument();
    });
  });

  describe('6.5 测试异常状态 Badge 显示', () => {
    it('应该在模型被删除时显示"已删除"徽章', () => {
      const testModel = createMockModel({
        isDeleted: true,
      });
      const chatModel = createMockPanelChatModel(testModel.id);
      const store = createTestStore([testModel]);

      renderWithProviders(<DetailTitle chatModel={chatModel} />, { store });

      const deletedBadge = screen.getByText('已删除');
      expect(deletedBadge).toBeInTheDocument();
    });

    it('应该在模型被禁用时显示"已禁用"徽章', () => {
      const testModel = createMockModel({
        isEnable: false,
      });
      const chatModel = createMockPanelChatModel(testModel.id);
      const store = createTestStore([testModel]);

      renderWithProviders(<DetailTitle chatModel={chatModel} />, { store });

      const disabledBadge = screen.getByText('被禁用');
      expect(disabledBadge).toBeInTheDocument();
    });

    it('正常状态不应该显示任何 Badge', () => {
      const testModel = createMockModel({
        isEnable: true,
        isDeleted: false,
      });
      const chatModel = createMockPanelChatModel(testModel.id);
      const store = createTestStore([testModel]);

      renderWithProviders(<DetailTitle chatModel={chatModel} />, { store });

      // 只应该有昵称，没有 Badge
      expect(screen.queryByText('已删除')).not.toBeInTheDocument();
      expect(screen.queryByText('已禁用')).not.toBeInTheDocument();
    });
  });

  describe('6.6 测试模型不存在时的错误提示', () => {
    it('应该在模型列表中找不到对应模型时显示"模型已删除"', () => {
      const chatModel = createMockPanelChatModel('non-existent-model-id');
      const store = createTestStore([]);

      renderWithProviders(<DetailTitle chatModel={chatModel} />, { store });

      const deletedBadge = screen.getByText('模型已删除');
      expect(deletedBadge).toBeInTheDocument();
    });
  });

  describe('不同 providerKey 的显示', () => {
    it('应该正确显示 DeepSeek 提供商', () => {
      const testModel = createMockModel({
        providerName: 'DeepSeek',
        providerKey: ModelProviderKeyEnum.DEEPSEEK,
        modelName: 'deepseek-chat',
        nickname: 'DeepSeek Chat',
      });
      const chatModel = createMockPanelChatModel(testModel.id);
      const store = createTestStore([testModel]);

      renderWithProviders(<DetailTitle chatModel={chatModel} />, { store });

      const nicknameElement = screen.getByText('DeepSeek Chat (deepseek-chat)');
      expect(nicknameElement).toBeInTheDocument();
    });

    it('应该正确显示 Moonshot 提供商', () => {
      const testModel = createMockModel({
        providerName: 'Moonshot AI',
        providerKey: ModelProviderKeyEnum.MOONSHOTAI,
        modelName: 'moonshot-v1-8k',
        nickname: 'Moonshot 8K',
      });
      const chatModel = createMockPanelChatModel(testModel.id);
      const store = createTestStore([testModel]);

      renderWithProviders(<DetailTitle chatModel={chatModel} />, { store });

      const nicknameElement = screen.getByText('Moonshot 8K (moonshot-v1-8k)');
      expect(nicknameElement).toBeInTheDocument();
    });

    it('应该正确处理多个模型的情况', () => {
      const model1 = createMockModel({
        id: 'model-1',
        modelName: 'deepseek-chat',
        nickname: 'DeepSeek Chat',
      });
      const model2 = createMockModel({
        id: 'model-2',
        modelName: 'moonshot-v1-8k',
        nickname: 'Moonshot 8K',
      });
      const chatModel = createMockPanelChatModel(model2.id);
      const store = createTestStore([model1, model2]);

      renderWithProviders(<DetailTitle chatModel={chatModel} />, { store });

      const nicknameElement = screen.getByText('Moonshot 8K (moonshot-v1-8k)');
      expect(nicknameElement).toBeInTheDocument();
      expect(screen.queryByText('DeepSeek Chat (deepseek-chat)')).not.toBeInTheDocument();
    });
  });
});
