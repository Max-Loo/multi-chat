/**
 * Title 组件单元测试
 *
 * 测试面板标题：
 * - 模型存在时显示昵称和名称
 * - 模型不存在时显示 destructive Badge
 * - 已禁用模型显示 secondary Badge
 * - Tooltip 显示完整信息
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Title from '@/pages/Chat/components/Panel/Detail/Title';
import { createMockPanelChatModel } from '@/__test__/helpers/mocks/panelLayout';

// Mock Redux
const mockModels: any[] = [];

vi.mock('@/hooks/redux', () => ({
  useAppSelector: (selector: any) => selector({
    models: { models: mockModels },
  }),
}));

vi.mock('react-i18next', () => globalThis.__mockI18n());

// Mock ProviderLogo
vi.mock('@/components/ProviderLogo', () => ({
  ProviderLogo: ({ providerKey, providerName, size }: any) => (
    <div data-testid="provider-logo" data-key={providerKey} data-name={providerName} data-size={size} />
  ),
}));

// Mock Tooltip
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}));

// Mock Badge
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ variant, children, className }: any) => (
    <div data-testid="badge" data-variant={variant} className={className}>{children}</div>
  ),
}));

describe('Title', () => {
  beforeEach(() => {
    mockModels.length = 0;
  });

  it('应该显示 destructive Badge 当模型不存在', () => {
    render(<Title chatModel={createMockPanelChatModel('nonexistent')} />);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-variant', 'destructive');
    expect(badge).toHaveTextContent('模型已删除');
  });

  it('应该显示 "nickname (modelName)" 当模型有昵称', () => {
    mockModels.push({
      id: 'model-1',
      nickname: '我的助手',
      modelName: 'gpt-4',
      providerKey: 'openai',
      providerName: 'OpenAI',
      isEnable: true,
    });

    render(<Title chatModel={createMockPanelChatModel('model-1')} />);

    expect(screen.getByText('我的助手 (gpt-4)')).toBeInTheDocument();
  });

  it('应该仅显示 modelName 当模型没有昵称', () => {
    mockModels.push({
      id: 'model-1',
      nickname: '',
      modelName: 'gpt-4',
      providerKey: 'openai',
      providerName: 'OpenAI',
      isEnable: true,
    });

    render(<Title chatModel={createMockPanelChatModel('model-1')} />);

    expect(screen.getByText('gpt-4')).toBeInTheDocument();
  });

  it('应该显示已删除 Badge 当模型被标记为已删除', () => {
    mockModels.push({
      id: 'model-1',
      nickname: '',
      modelName: 'gpt-4',
      providerKey: 'openai',
      providerName: 'OpenAI',
      isEnable: true,
      isDeleted: true,
    });

    render(<Title chatModel={createMockPanelChatModel('model-1')} />);

    const badges = screen.getAllByTestId('badge');
    const deletedBadge = badges.find((b) => b.textContent === '已删除');
    expect(deletedBadge).toBeDefined();
    expect(deletedBadge).toHaveAttribute('data-variant', 'destructive');
  });

  it('应该显示已禁用 Badge 当模型 isEnable 为 false', () => {
    mockModels.push({
      id: 'model-1',
      nickname: '',
      modelName: 'gpt-4',
      providerKey: 'openai',
      providerName: 'OpenAI',
      isEnable: false,
    });

    render(<Title chatModel={createMockPanelChatModel('model-1')} />);

    const badges = screen.getAllByTestId('badge');
    const disabledBadge = badges.find((b) => b.textContent === '被禁用');
    expect(disabledBadge).toBeDefined();
    expect(disabledBadge).toHaveAttribute('data-variant', 'secondary');
  });

  it('应该渲染 ProviderLogo 使用正确的 props', () => {
    mockModels.push({
      id: 'model-1',
      nickname: '',
      modelName: 'gpt-4',
      providerKey: 'openai',
      providerName: 'OpenAI',
      isEnable: true,
    });

    render(<Title chatModel={createMockPanelChatModel('model-1')} />);

    const logo = screen.getByTestId('provider-logo');
    expect(logo).toHaveAttribute('data-key', 'openai');
    expect(logo).toHaveAttribute('data-name', 'OpenAI');
    expect(logo).toHaveAttribute('data-size', '24');
  });

  it('应该在 Tooltip 中显示完整模型信息', () => {
    mockModels.push({
      id: 'model-1',
      nickname: '助手',
      modelName: 'gpt-4',
      providerKey: 'openai',
      providerName: 'OpenAI',
      isEnable: true,
    });

    render(<Title chatModel={createMockPanelChatModel('model-1')} />);

    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip).toHaveTextContent('OpenAI');
    expect(tooltip).toHaveTextContent('gpt-4');
    expect(tooltip).toHaveTextContent('助手');
  });

  it('应该在 Tooltip 中昵称为空时显示 "-"', () => {
    mockModels.push({
      id: 'model-1',
      nickname: '',
      modelName: 'gpt-4',
      providerKey: 'openai',
      providerName: 'OpenAI',
      isEnable: true,
    });

    render(<Title chatModel={createMockPanelChatModel('model-1')} />);

    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip).toHaveTextContent('昵称');
    expect(tooltip).toHaveTextContent('-');
  });

  it('正常启用模型不应显示状态 Badge', () => {
    mockModels.push({
      id: 'model-1',
      nickname: '助手',
      modelName: 'gpt-4',
      providerKey: 'openai',
      providerName: 'OpenAI',
      isEnable: true,
    });

    render(<Title chatModel={createMockPanelChatModel('model-1')} />);

    const badges = screen.queryAllByTestId('badge');
    expect(badges).toHaveLength(0);
  });

  it('当模型同时标记为已删除和已禁用时，应优先显示已删除 Badge', () => {
    mockModels.push({
      id: 'model-1',
      nickname: '',
      modelName: 'gpt-4',
      providerKey: 'openai',
      providerName: 'OpenAI',
      isEnable: false,
      isDeleted: true,
    });

    render(<Title chatModel={createMockPanelChatModel('model-1')} />);

    const badges = screen.getAllByTestId('badge');
    const deletedBadge = badges.find((b) => b.textContent === '已删除');
    expect(deletedBadge).toBeDefined();
    expect(deletedBadge).toHaveAttribute('data-variant', 'destructive');
  });
});
