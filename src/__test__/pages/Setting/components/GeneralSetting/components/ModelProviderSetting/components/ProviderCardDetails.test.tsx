import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, within, fireEvent } from '@testing-library/react';
import { ProviderCardDetails } from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardDetails';
import { createMockRemoteProvider, createDeepSeekProvider } from '@/__test__/helpers/fixtures';

/**
 * Mock react-i18next 模块
 * 提供测试用的国际化函数模拟实现
 */
vi.mock('react-i18next', () => {
  const zhResources = {
    setting: {
      modelProvider: {
        modelCount: '共 {{count}} 个模型',
        searchPlaceholder: '搜索模型',
        searchResult: '找到 {{count}} 个模型',
        totalModels: '共 {{count}} 个模型',
        noModels: '暂无模型',
      },
    },
  } as const;

  return {
    useTranslation: () => ({
      t: ((keyOrSelector: string | ((resources: typeof zhResources) => string), options?: { count?: number }) => {
        if (typeof keyOrSelector === 'function') {
          let result = keyOrSelector(zhResources);
          if (options?.count !== undefined) {
            result = result.replace('{{count}}', String(options.count));
          }
          return result;
        }
        return keyOrSelector;
      }) as unknown,
      i18n: {
        language: 'zh',
        changeLanguage: vi.fn(),
      },
    }),
  };
});

describe('ProviderCardDetails', () => {
  describe('搜索过滤逻辑', () => {
    it('应该过滤模型列表当用户输入搜索文本', async () => {
      const mockProvider = createDeepSeekProvider({
        models: [
          { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
          { modelKey: 'deepseek-coder', modelName: 'DeepSeek Coder' },
          { modelKey: 'gpt-4', modelName: 'GPT-4' },
        ],
      });

      const { container } = render(<ProviderCardDetails provider={mockProvider} />);
      const searchInput = within(container).getByPlaceholderText(/搜索模型/i);
      
      // 使用 fireEvent.change 一次性设置值
      fireEvent.change(searchInput, { target: { value: 'chat' } });

      // 等待防抖完成（300ms + 更长的缓冲时间）
      await waitFor(() => {
        expect(within(container).getAllByText('DeepSeek Chat').length).toBeGreaterThan(0);
        expect(within(container).queryByText('DeepSeek Coder')).not.toBeInTheDocument();
        expect(within(container).queryByText('GPT-4')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('应该显示所有模型当搜索框为空', async () => {
      const mockProvider = createDeepSeekProvider({
        models: [
          { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
          { modelKey: 'deepseek-coder', modelName: 'DeepSeek Coder' },
          { modelKey: 'gpt-4', modelName: 'GPT-4' },
        ],
      });

      const { container } = render(<ProviderCardDetails provider={mockProvider} />);

      // 初始状态应该显示所有模型
      expect(within(container).getAllByText('DeepSeek Chat').length).toBeGreaterThan(0);
      expect(within(container).getAllByText('DeepSeek Coder').length).toBeGreaterThan(0);
      expect(within(container).getAllByText('GPT-4').length).toBeGreaterThan(0);

      const searchInput = within(container).getByPlaceholderText(/搜索模型/i);
      
      // 输入搜索词
      fireEvent.change(searchInput, { target: { value: 'chat' } });

      // 等待过滤完成
      await waitFor(() => {
        const chatModels = within(container).queryAllByText('DeepSeek Chat');
        const coderModels = within(container).queryAllByText('DeepSeek Coder');
        expect(chatModels.length).toBeGreaterThan(0);
        expect(coderModels.length).toBe(0);
      }, { timeout: 500 });

      // 清空搜索框
      fireEvent.change(searchInput, { target: { value: '' } });

      // 等待恢复显示所有模型
      await waitFor(() => {
        expect(within(container).getAllByText('DeepSeek Chat').length).toBeGreaterThan(0);
        expect(within(container).getAllByText('DeepSeek Coder').length).toBeGreaterThan(0);
        expect(within(container).getAllByText('GPT-4').length).toBeGreaterThan(0);
      }, { timeout: 500 });
    });
  });

  describe('防抖功能', () => {
    it('应该在停止输入后 300ms 触发过滤', async () => {
      const mockProvider = createDeepSeekProvider({
        models: [
          { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
          { modelKey: 'deepseek-coder', modelName: 'DeepSeek Coder' },
        ],
      });

      const { container } = render(<ProviderCardDetails provider={mockProvider} />);
      const searchInput = within(container).getByPlaceholderText(/搜索模型/i);
      
      // 初始状态：显示所有模型
      expect(within(container).getAllByText('DeepSeek Chat').length).toBeGreaterThan(0);
      expect(within(container).getAllByText('DeepSeek Coder').length).toBeGreaterThan(0);

      // 输入搜索词
      fireEvent.change(searchInput, { target: { value: 'chat' } });

      // 立即检查：过滤还未发生，所有模型仍在显示
      expect(within(container).getAllByText('DeepSeek Chat').length).toBeGreaterThan(0);
      expect(within(container).getAllByText('DeepSeek Coder').length).toBeGreaterThan(0);

      // 等待 200ms：过滤仍未发生
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(within(container).getAllByText('DeepSeek Coder').length).toBeGreaterThan(0);

      // 等待到 350ms：过滤应该发生
      await waitFor(() => {
        expect(within(container).queryAllByText('DeepSeek Coder').length).toBe(0);
      }, { timeout: 500 });
    });

    it('应该重置防抖计时器当用户继续输入', async () => {
      const mockProvider = createDeepSeekProvider({
        models: [
          { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
          { modelKey: 'deepseek-coder', modelName: 'DeepSeek Coder' },
        ],
      });

      const { container } = render(<ProviderCardDetails provider={mockProvider} />);
      const searchInput = within(container).getByPlaceholderText(/搜索模型/i);

      // 输入第一个字符
      fireEvent.change(searchInput, { target: { value: 'c' } });

      // 等待 200ms
      await new Promise(resolve => setTimeout(resolve, 200));

      // 输入第二个字符（防抖计时器重置）
      fireEvent.change(searchInput, { target: { value: 'ch' } });

      // 等待 200ms（从第二次输入开始算）
      await new Promise(resolve => setTimeout(resolve, 200));

      // 过滤仍未发生（因为总时间从第一次输入算起是 400ms，但从第二次输入算起只有 200ms）
      expect(within(container).getAllByText('DeepSeek Coder').length).toBeGreaterThan(0);

      // 再等待 150ms（从第二次输入算起达到 350ms）
      await waitFor(() => {
        expect(within(container).queryAllByText('DeepSeek Coder').length).toBe(0);
      }, { timeout: 500 });
    });

    it('应该快速连续输入时只在最后一次输入后触发一次过滤', async () => {
      const mockProvider = createDeepSeekProvider({
        models: [
          { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
          { modelKey: 'deepseek-coder', modelName: 'DeepSeek Coder' },
        ],
      });

      const { container } = render(<ProviderCardDetails provider={mockProvider} />);
      const searchInput = within(container).getByPlaceholderText(/搜索模型/i);

      // 快速连续输入 3 个字符
      fireEvent.change(searchInput, { target: { value: 'c' } });
      await new Promise(resolve => setTimeout(resolve, 50));

      fireEvent.change(searchInput, { target: { value: 'ch' } });
      await new Promise(resolve => setTimeout(resolve, 50));

      fireEvent.change(searchInput, { target: { value: 'cha' } });
      await new Promise(resolve => setTimeout(resolve, 50));

      // 总共过了 150ms，还未达到 300ms，过滤不应发生
      expect(within(container).getAllByText('DeepSeek Coder').length).toBeGreaterThan(0);

      // 再等待 200ms（总共 350ms），过滤应该发生
      await waitFor(() => {
        const coders = within(container).queryAllByText('DeepSeek Coder');
        const chats = within(container).getAllByText('DeepSeek Chat');
        expect(coders.length).toBe(0);
        expect(chats.length).toBeGreaterThan(0);
      }, { timeout: 500 });
    });
  });

  describe('模型列表渲染', () => {
    it('应该渲染所有模型', () => {
      const mockProvider = createDeepSeekProvider({
        models: [
          { modelKey: 'gpt-4', modelName: 'GPT-4' },
          { modelKey: 'gpt-4-turbo', modelName: 'GPT-4 Turbo' },
          { modelKey: 'gpt-3.5-turbo', modelName: 'GPT-3.5 Turbo' },
          { modelKey: 'gpt-4o', modelName: 'GPT-4o' },
          { modelKey: 'gpt-4o-mini', modelName: 'GPT-4o Mini' },
        ],
      });

      const { container } = render(<ProviderCardDetails provider={mockProvider} />);

      // 验证所有 5 个模型都被渲染
      expect(within(container).getAllByText('GPT-4').length).toBeGreaterThan(0);
      expect(within(container).getAllByText('GPT-4 Turbo').length).toBeGreaterThan(0);
      expect(within(container).getAllByText('GPT-3.5 Turbo').length).toBeGreaterThan(0);
      expect(within(container).getAllByText('GPT-4o').length).toBeGreaterThan(0);
      expect(within(container).getAllByText('GPT-4o Mini').length).toBeGreaterThan(0);
    });

    it('应该显示空状态提示当模型列表为空', () => {
      const mockProvider = createMockRemoteProvider({
        models: [],
      });

      const { container } = render(<ProviderCardDetails provider={mockProvider} />);

      // 应该显示总模型数为 0
      expect(within(container).getAllByText('共 0 个模型').length).toBeGreaterThan(0);
    });

    it('应该显示过滤后的结果数量', async () => {
      const mockProvider = createDeepSeekProvider({
        models: [
          { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
          { modelKey: 'deepseek-coder', modelName: 'DeepSeek Coder' },
          { modelKey: 'deepseek-reasoner', modelName: 'DeepSeek Reasoner' },
        ],
      });

      const { container } = render(<ProviderCardDetails provider={mockProvider} />);

      // 初始状态：显示总模型数
      expect(within(container).getAllByText('共 3 个模型').length).toBeGreaterThan(0);

      const searchInput = within(container).getByPlaceholderText(/搜索模型/i);
      
      // 输入搜索词
      fireEvent.change(searchInput, { target: { value: 'chat' } });

      // 应该显示找到的结果数量
      await waitFor(() => {
        expect(within(container).getAllByText('找到 1 个模型').length).toBeGreaterThan(0);
      }, { timeout: 500 });

      // 验证只有一个模型显示
      const chatModels = within(container).queryAllByText('DeepSeek Chat');
      const coderModels = within(container).queryAllByText('DeepSeek Coder');
      const reasonerModels = within(container).queryAllByText('DeepSeek Reasoner');
      
      expect(chatModels.length).toBeGreaterThan(0);
      expect(coderModels.length).toBe(0);
      expect(reasonerModels.length).toBe(0);
    });
  });
});
