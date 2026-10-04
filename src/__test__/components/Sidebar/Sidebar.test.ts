/**
 * Sidebar 组件测试
 *
 * 验证导航项渲染、激活状态、点击导航与「记住上次聊天」跳转逻辑
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import { Sidebar } from '@/components/Sidebar';

// vue-router mock：可变当前路径 + push 间谍
const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  currentPath: '/model',
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: routerMock.currentPath }),
  useRouter: () => ({ push: routerMock.push }),
}));

// i18n mock：dot 路径查找，缺失时回退键名
vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      navigation: { chat: '聊天', model: '模型', setting: '设置' },
      common: { a11y: { mainNav: '主导航' } },
    }).useTranslation(),
}));

// 聊天选择器 mock：可变选中聊天（保持 computed 的 .value 读取形态）
const selectorMock = vi.hoisted(() => ({ value: undefined as { id: string } | undefined }));

vi.mock('@/store/selectors/chatSelectors', () => ({
  useSelectedChat: () => selectorMock,
}));

// 聊天页导航 mock
const navigateMock = vi.hoisted(() => ({ navigateToChat: vi.fn() }));

vi.mock('@/composables/useNavigateToPage', () => ({
  useNavigateToChat: () => navigateMock,
}));

/** 获取全部导航按钮 */
function getNavButtons(): HTMLElement[] {
  return screen.getAllByRole('button');
}

describe('Sidebar 组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerMock.currentPath = '/model';
    selectorMock.value = undefined;
  });

  it('应该渲染 3 个导航项', () => {
    render(Sidebar);

    expect(getNavButtons()).toHaveLength(3);
  });

  it('导航项应该包含正确的国际化文本', () => {
    render(Sidebar);

    expect(screen.getByTitle('聊天')).toBeInTheDocument();
    expect(screen.getByTitle('模型')).toBeInTheDocument();
    expect(screen.getByTitle('设置')).toBeInTheDocument();
  });

  it('在当前路由时导航项应显示激活状态（aria-current）', () => {
    routerMock.currentPath = '/chat';
    render(Sidebar);

    const chatButton = screen.getByTitle('聊天');
    expect(chatButton).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTitle('模型')).not.toHaveAttribute('aria-current');
  });

  it('在子路径 /chat/123 时聊天导航项应显示激活状态', () => {
    routerMock.currentPath = '/chat/123';
    render(Sidebar);

    expect(screen.getByTitle('聊天')).toHaveAttribute('aria-current', 'page');
  });

  it('点击非激活导航项应触发导航', async () => {
    render(Sidebar);

    await fireEvent.click(screen.getByTitle('设置'));

    expect(routerMock.push).toHaveBeenCalledWith('/setting');
  });

  it('点击已激活导航项不应触发重复导航', async () => {
    routerMock.currentPath = '/chat';
    render(Sidebar);

    await fireEvent.click(screen.getByTitle('聊天'));

    expect(routerMock.push).not.toHaveBeenCalled();
    expect(navigateMock.navigateToChat).not.toHaveBeenCalled();
  });

  it('从其他页面点击聊天导航且存在选中聊天时，应携带 chatId 跳转', async () => {
    selectorMock.value = { id: 'chat-42' };
    render(Sidebar);

    await fireEvent.click(screen.getByTitle('聊天'));

    expect(navigateMock.navigateToChat).toHaveBeenCalledWith({ chatId: 'chat-42' });
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('从其他页面点击聊天导航且不存在选中聊天时，应直接导航到 /chat', async () => {
    render(Sidebar);

    await fireEvent.click(screen.getByTitle('聊天'));

    expect(routerMock.push).toHaveBeenCalledWith('/chat');
  });

  it('应该使用导航栏的可访问性标签', () => {
    render(Sidebar);

    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument();
  });
});
