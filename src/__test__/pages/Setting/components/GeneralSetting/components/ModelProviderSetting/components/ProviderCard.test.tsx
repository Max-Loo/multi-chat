import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderCard } from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCard';
import type { RemoteProviderData } from '@/services/modelRemoteService';

/**
 * Mock react-i18next 模块
 * 提供测试用的国际化函数模拟实现，支持类型安全语法
 */
vi.mock('react-i18next', () => {
  const zhResources = {
    setting: {
      modelProvider: {
        status: {
          available: '可用',
          unavailable: '不可用',
        },
        modelCount: '共 {{count}} 个模型',
        clickToViewDetails: '点击查看详情',
        searchPlaceholder: '搜索模型',
        searchResult: '找到 {{count}} 个模型',
        totalModels: '共 {{count}} 个模型',
      },
    },
  } as const;

  return {
    useTranslation: () => ({
      t: ((keyOrSelector: string | ((resources: typeof zhResources) => string), options?: { count?: number }) => {
        if (typeof keyOrSelector === 'function') {
          let result = keyOrSelector(zhResources);
          // 处理模板字符串中的 {{count}} 占位符
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

const mockProvider: RemoteProviderData = {
  providerKey: 'deepseek',
  providerName: 'DeepSeek',
  api: 'https://api.deepseek.com',
  models: [
    { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
    { modelKey: 'deepseek-coder', modelName: 'DeepSeek Coder' },
  ],
};

describe('ProviderCard', () => {
  it('应该渲染供应商名称', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        isExpanded={false}
        onToggle={() => {}}
        status="available"
      />
    );

    expect(screen.getByText('DeepSeek')).toBeInTheDocument();
  });

  it('应该显示可用状态徽章', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        isExpanded={false}
        onToggle={() => {}}
        status="available"
      />
    );

    expect(screen.getAllByText('可用')[0]).toBeInTheDocument();
  });

  it('应该显示模型数量', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        isExpanded={false}
        onToggle={() => {}}
        status="available"
      />
    );

    expect(screen.getAllByText('共 2 个模型')[0]).toBeInTheDocument();
  });

  it('点击时应该调用 onToggle', () => {
    const onToggle = vi.fn();

    const { container } = render(
      <ProviderCard
        provider={mockProvider}
        isExpanded={false}
        onToggle={onToggle}
        status="available"
      />
    );

    // 直接查找带有 .cursor-pointer 类的 Card 元素
    const cardElement = container.querySelector('.cursor-pointer');
    expect(cardElement).toBeInTheDocument();
    fireEvent.click(cardElement!);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('展开时应该显示详细信息', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        isExpanded={true}
        onToggle={() => {}}
        status="available"
      />
    );

    // 检查是否显示模型列表
    expect(screen.getByText('DeepSeek Chat')).toBeInTheDocument();
    expect(screen.getByText('DeepSeek Coder')).toBeInTheDocument();
  });

  // 任务 4.5.1: 收起时不应该显示模型列表
  it('收起时不应该显示模型列表', () => {
    const { container } = render(
      <ProviderCard
        provider={mockProvider}
        isExpanded={false}
        onToggle={() => {}}
        status="available"
      />
    );

    // 检查模型列表不应该显示（使用 container 限制查询范围）
    expect(container.querySelector('.border-t')).not.toBeInTheDocument();
  });

  // 任务 4.5.2: 应该渲染供应商图标（首字母）
  it('应该渲染供应商图标（首字母）', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        isExpanded={false}
        onToggle={() => {}}
        status="available"
      />
    );

    // 检查供应商图标（首字母 "D"）
    expect(screen.getAllByText('D')[0]).toBeInTheDocument();
  });

  // 任务 4.5.3: 应该显示不可用状态徽章
  it('应该显示不可用状态徽章', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        isExpanded={false}
        onToggle={() => {}}
        status="unavailable"
      />
    );

    expect(screen.getByText('不可用')).toBeInTheDocument();
  });

  // 任务 4.5.4: 点击展开后应该显示模型配置信息
  it('点击展开后应该显示模型配置信息', () => {
    const onToggle = vi.fn();

    // 初始收起状态
    const { container, rerender } = render(
      <ProviderCard
        provider={mockProvider}
        isExpanded={false}
        onToggle={onToggle}
        status="available"
      />
    );

    // 点击展开
    const cardElement = container.querySelector('.cursor-pointer');
    expect(cardElement).toBeInTheDocument();
    fireEvent.click(cardElement!);
    expect(onToggle).toHaveBeenCalledTimes(1);

    // 重新渲染为展开状态
    rerender(
      <ProviderCard
        provider={mockProvider}
        isExpanded={true}
        onToggle={onToggle}
        status="available"
      />
    );

    // 检查模型配置信息显示
    expect(screen.getAllByText('DeepSeek Chat')[0]).toBeInTheDocument();
  });

  // 任务 4.5.5: 多次点击应该正确切换展开/收起状态
  it('多次点击应该正确切换展开/收起状态', () => {
    const onToggle = vi.fn();

    const { container } = render(
      <ProviderCard
        provider={mockProvider}
        isExpanded={false}
        onToggle={onToggle}
        status="available"
      />
    );

    const cardElement = container.querySelector('.cursor-pointer')!;
    expect(cardElement).toBeInTheDocument();

    // 第一次点击
    fireEvent.click(cardElement);
    expect(onToggle).toHaveBeenCalledTimes(1);

    // 第二次点击
    fireEvent.click(cardElement);
    expect(onToggle).toHaveBeenCalledTimes(2);

    // 第三次点击
    fireEvent.click(cardElement);
    expect(onToggle).toHaveBeenCalledTimes(3);
  });
});
