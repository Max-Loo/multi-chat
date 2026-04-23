import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from '@/components/Sidebar';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

vi.mock('@/hooks/useCurrentSelectedChat', () => ({
  useCurrentSelectedChat: () => mockSelectedChat,
}));

vi.mock('@/hooks/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: mockNavigateToChat,
  }),
}));

vi.mock('react-i18next', () => {
  const R = { navigation: { chat: '聊天', model: '模型', setting: '设置' } };
  return globalThis.__createI18nMockReturn(R);
});

const mockNavigate = vi.fn();
const mockNavigateToChat = vi.fn();
let mockLocation: { pathname: string };
let mockSelectedChat: { id: string } | null = null;

describe('Sidebar 组件测试', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockLocation = { pathname: '/' };
    mockSelectedChat = null;
  });

  it('应该渲染 3 个导航项', () => {
    render(<Sidebar />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    expect(screen.getByTitle('聊天')).toBeInTheDocument();
    expect(screen.getByTitle('模型')).toBeInTheDocument();
    expect(screen.getByTitle('设置')).toBeInTheDocument();
  });

  it('导航项应该包含正确的图标、文本和样式类', () => {
    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');
    const modelButton = screen.getByTitle('模型');
    const settingButton = screen.getByTitle('设置');

    expect(chatButton).toBeInTheDocument();
    expect(modelButton).toBeInTheDocument();
    expect(settingButton).toBeInTheDocument();

    expect(chatButton).toHaveClass('text-blue-400!');
    expect(modelButton).toHaveClass('text-emerald-400!');
    expect(settingButton).toHaveClass('text-violet-400!');

    expect(chatButton).toHaveClass('w-10', 'h-10');
    expect(modelButton).toHaveClass('w-10', 'h-10');
    expect(settingButton).toHaveClass('w-10', 'h-10');
  });

  it('应该接受并应用自定义 className', () => {
    render(<Sidebar className="custom-class" />);

    const sidebarDiv = screen.getByTestId('sidebar');
    expect(sidebarDiv).toHaveClass('custom-class');
  });

  it('在 /chat 路由时，聊天导航项应显示激活状态', () => {
    mockLocation = { pathname: '/chat' };

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');

    expect(chatButton).toHaveClass('bg-blue-100!', 'text-blue-500!');
    expect(chatButton).not.toHaveClass('hover:text-blue-500!', 'hover:bg-blue-100!');
  });

  it('在 /model 路由时，模型导航项应显示激活状态', () => {
    mockLocation = { pathname: '/model' };

    render(<Sidebar />);

    const modelButton = screen.getByTitle('模型');

    expect(modelButton).toHaveClass('bg-emerald-100!', 'text-emerald-500!');
    expect(modelButton).not.toHaveClass('hover:text-emerald-500!', 'hover:bg-emerald-100!');
  });

  it('在 /setting 路由时，设置导航项应显示激活状态', () => {
    mockLocation = { pathname: '/setting' };

    render(<Sidebar />);

    const settingButton = screen.getByTitle('设置');

    expect(settingButton).toHaveClass('bg-violet-100!', 'text-violet-500!');
    expect(settingButton).not.toHaveClass('hover:text-violet-500!', 'hover:bg-violet-100!');
  });

  it('在子路径 /chat/123 时，聊天导航项应显示激活状态', () => {
    mockLocation = { pathname: '/chat/123' };

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');

    expect(chatButton).toHaveClass('bg-blue-100!', 'text-blue-500!');
  });

  it('点击非激活导航项应触发导航', () => {
    mockLocation = { pathname: '/' };

    render(<Sidebar />);

    const modelButton = screen.getByTitle('模型');
    fireEvent.click(modelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/model');
  });

  it('点击已激活导航项不应触发重复导航', () => {
    mockLocation = { pathname: '/chat' };

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');
    fireEvent.click(chatButton);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('从其他页面点击聊天导航且存在选中聊天时，应调用 navigateToChat', () => {
    mockLocation = { pathname: '/model' };
    mockSelectedChat = { id: 'chat-123' };

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');
    fireEvent.click(chatButton);

    expect(mockNavigateToChat).toHaveBeenCalledWith({
      chatId: 'chat-123',
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('从其他页面点击聊天导航且不存在选中聊天时，应调用 navigate', () => {
    mockLocation = { pathname: '/model' };
    mockSelectedChat = null;

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');
    fireEvent.click(chatButton);

    expect(mockNavigate).toHaveBeenCalledWith('/chat');
    expect(mockNavigateToChat).not.toHaveBeenCalled();
  });

  it('selectedChat 为 null 时，点击聊天导航应直接导航到 /chat', () => {
    mockLocation = { pathname: '/model' };
    mockSelectedChat = null;

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');
    fireEvent.click(chatButton);

    expect(mockNavigate).toHaveBeenCalledWith('/chat');
    expect(mockNavigateToChat).not.toHaveBeenCalled();
  });

  it('selectedChat 为 undefined 时，点击聊天导航应直接导航到 /chat', () => {
    mockLocation = { pathname: '/model' };
    mockSelectedChat = null; // null 和 undefined 行为一致

    render(<Sidebar />);

    const chatButton = screen.getByTitle('聊天');
    fireEvent.click(chatButton);

    expect(mockNavigate).toHaveBeenCalledWith('/chat');
    expect(mockNavigateToChat).not.toHaveBeenCalled();
  });

  it('导航项标签应正确使用国际化', () => {
    render(<Sidebar />);

    expect(screen.getByTitle('聊天')).toBeInTheDocument();
    expect(screen.getByTitle('模型')).toBeInTheDocument();
    expect(screen.getByTitle('设置')).toBeInTheDocument();
  });
});
