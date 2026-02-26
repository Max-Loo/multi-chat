import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProviderCard } from '../ProviderCard';
import type { RemoteProviderData } from '@/services/modelRemoteService';

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

    expect(screen.getByText('可用')).toBeInTheDocument();
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

    expect(screen.getByText('共 2 个模型')).toBeInTheDocument();
  });

  it('点击时应该调用 onToggle', () => {
    const onToggle = vi.fn();

    render(
      <ProviderCard
        provider={mockProvider}
        isExpanded={false}
        onToggle={onToggle}
        status="available"
      />
    );

    const card = screen.getByText('DeepSeek').closest('.cursor-pointer');
    fireEvent.click(card!);

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
});
