/**
 * Vue CreateModel 页面与 ModelHeader/ModelSidebar 组件测试
 *
 * 对应 React 版 CreateModel.test.tsx、ModelHeader.test.tsx、ModelSidebar.test.tsx 的行为断言：
 * 页面布局（侧边栏+表单区）、供应商选择与切换、表单字段标签、
 * Header 桌面/移动端分支与交互、Sidebar 列表/选中态/过滤/返回导航。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';

// Mock vue-router
const pushMock = vi.hoisted(() => vi.fn());
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ path: '/model/add', query: {} }),
}));

// hoisted：可变的移动端标志
const { mockIsMobile } = vi.hoisted(() => ({ mockIsMobile: { value: false } }));
vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () =>
    globalThis.__createResponsiveMock({
      isMobile: mockIsMobile.value,
      isDesktop: !mockIsMobile.value,
      layoutMode: mockIsMobile.value ? 'mobile' : 'desktop',
    }),
}));

// Mock toastQueue
vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

// Mock 响应式 i18n 绑定
vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    model: {
      title: '模型管理',
      openMenu: '打开菜单',
      modelProvider: '模型供应商',
      searchModel: '搜索模型...',
      addModelSuccess: '添加成功',
      addModelFailed: '添加失败',
      model: '模型',
      modelNickname: '模型昵称',
      modelNicknameRequired: '请输入模型昵称',
      apiKey: 'API 密钥',
      apiKeyRequired: '请输入 API 密钥',
      apiAddress: 'API 地址',
      apiAddressRequired: '请输入 API 地址',
      modelRequired: '请选择模型',
    },
    common: { goBack: '返回', remark: '备注', submit: '提交', a11y: { modelProvider: '模型供应商导航', modelProviderNav: '模型供应商导航' } },
  }));

import CreateModel from '@/pages/Model/CreateModel.vue';
import ModelHeader from '@/pages/Model/CreateModel/components/ModelHeader.vue';
import ModelSidebar from '@/pages/Model/CreateModel/components/ModelSidebar.vue';
import { useModelProviderStore } from '@/store/pinia/modelProvider';
import { useModelPageStore } from '@/store/pinia/modelPage';
import { createMockRemoteProviders } from '@/__test__/helpers/fixtures/modelProvider';
import { ModelProviderKeyEnum } from '@/utils/enums';

/** 组装供应商 store */
const setupProviders = () => {
  const providerStore = useModelProviderStore();
  providerStore.providers = createMockRemoteProviders();
  return providerStore;
};

describe('CreateModel（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    mockIsMobile.value = false;
    pushMock.mockClear();
  });

  it('渲染侧边栏和表单区域', () => {
    setupProviders();
    render(CreateModel);

    expect(screen.getByTestId('model-sidebar')).toBeVisible();
    expect(screen.getByTestId('model-content')).toBeVisible();
  });

  it('显示模型提供商选择侧边栏', () => {
    setupProviders();
    render(CreateModel);

    expect(screen.getAllByTitle('DeepSeek').length).toBeGreaterThan(0);
    expect(screen.getAllByTitle('Kimi').length).toBeGreaterThan(0);
    expect(screen.getAllByTitle('ZhipuAI').length).toBeGreaterThan(0);
  });

  it('显示模型配置表单与提交按钮', () => {
    setupProviders();
    render(CreateModel);

    expect(screen.getByTestId('model-config-form')).toBeVisible();
    expect(screen.getAllByRole('button', { name: '提交' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('模型').length).toBeGreaterThan(0);
  });

  it('渲染全部表单字段标签', () => {
    setupProviders();
    render(CreateModel);

    expect(screen.getAllByText('模型昵称').length).toBeGreaterThan(0);
    expect(screen.getAllByText('API 密钥').length).toBeGreaterThan(0);
    expect(screen.getAllByText('API 地址').length).toBeGreaterThan(0);
    expect(screen.getAllByText('备注').length).toBeGreaterThan(0);
  });

  it('切换模型提供商后表单区域仍可用', async () => {
    setupProviders();
    render(CreateModel);

    await fireEvent.click(screen.getAllByTitle('Kimi')[0]);

    await waitFor(() => expect(screen.getByTestId('model-config-form')).toBeVisible());
  });

  it('移动端通过抽屉渲染侧边栏并显示 Header', () => {
    mockIsMobile.value = true;
    setupProviders();
    render(CreateModel);

    expect(screen.getByText('模型管理')).toBeVisible();
    expect(screen.queryByTestId('model-sidebar')).toBeNull();
    mockIsMobile.value = false;
  });
});

describe('ModelHeader（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockIsMobile.value = false;
    pushMock.mockClear();
  });

  it('桌面端仅渲染标题，不渲染返回和菜单按钮', () => {
    render(ModelHeader);

    expect(screen.getByText('模型管理')).toBeVisible();
    expect(screen.queryByRole('button', { name: '返回' })).toBeNull();
    expect(screen.queryByRole('button', { name: '打开菜单' })).toBeNull();
  });

  it('移动端渲染返回按钮和菜单按钮', () => {
    mockIsMobile.value = true;
    render(ModelHeader);

    expect(screen.getByRole('button', { name: '返回' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '打开菜单' })).toBeTruthy();
    mockIsMobile.value = false;
  });

  it('点击返回按钮导航到列表页', async () => {
    mockIsMobile.value = true;
    render(ModelHeader);

    await fireEvent.click(screen.getByRole('button', { name: '返回' }));

    expect(pushMock).toHaveBeenCalledWith('/model/table');
    mockIsMobile.value = false;
  });

  it('点击菜单按钮翻转抽屉开关', async () => {
    mockIsMobile.value = true;
    const modelPageStore = useModelPageStore();
    render(ModelHeader);

    await fireEvent.click(screen.getByRole('button', { name: '打开菜单' }));

    expect(modelPageStore.isDrawerOpen).toBe(true);
    mockIsMobile.value = false;
  });
});

describe('ModelSidebar（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('渲染所有供应商', () => {
    setupProviders();
    render(ModelSidebar, { props: { value: ModelProviderKeyEnum.DEEPSEEK } });

    expect(screen.getByText('DeepSeek')).toBeVisible();
    expect(screen.getByText('Kimi')).toBeVisible();
    expect(screen.getByText('ZhipuAI')).toBeVisible();
  });

  it('空供应商列表不渲染任何供应商按钮', () => {
    const providerStore = useModelProviderStore();
    providerStore.providers = [];
    render(ModelSidebar, { props: { value: ModelProviderKeyEnum.DEEPSEEK } });

    expect(screen.queryByText('DeepSeek')).toBeNull();
  });

  it('选中供应商带 aria-current 标记且唯一', () => {
    setupProviders();
    render(ModelSidebar, { props: { value: ModelProviderKeyEnum.DEEPSEEK } });

    const deepseek = screen.getByTitle('DeepSeek');
    expect(deepseek.getAttribute('aria-current')).toBe('page');
    expect(screen.getByTitle('Kimi').getAttribute('aria-current')).toBeNull();
    expect(screen.getByTitle('ZhipuAI').getAttribute('aria-current')).toBeNull();
  });

  it('渲染搜索输入框并支持输入', async () => {
    setupProviders();
    render(ModelSidebar, { props: { value: ModelProviderKeyEnum.DEEPSEEK } });

    const input = screen.getByPlaceholderText('搜索模型...');
    await fireEvent.update(input, 'deep');

    expect((input as HTMLInputElement).value).toBe('deep');
  });

  it('点击供应商发出 change 事件', async () => {
    setupProviders();
    const { emitted } = render(ModelSidebar, { props: { value: ModelProviderKeyEnum.DEEPSEEK } });

    await fireEvent.click(screen.getByTitle('Kimi'));

    expect(emitted()['change']).toBeTruthy();
    expect(emitted()['change'][0]).toEqual([ModelProviderKeyEnum.MOONSHOTAI]);
  });

  it('支持重复选择同一供应商', async () => {
    setupProviders();
    const { emitted } = render(ModelSidebar, { props: { value: ModelProviderKeyEnum.DEEPSEEK } });

    await fireEvent.click(screen.getByTitle('DeepSeek'));
    await fireEvent.click(screen.getByTitle('DeepSeek'));

    expect(emitted()['change'].length).toBe(2);
    expect(emitted()['change'][1]).toEqual([ModelProviderKeyEnum.DEEPSEEK]);
  });

  it('渲染返回按钮并导航到列表页', async () => {
    setupProviders();
    render(ModelSidebar, { props: { value: ModelProviderKeyEnum.DEEPSEEK } });

    expect(screen.getByText('模型供应商')).toBeVisible();
    // 返回按钮为纯图标无 title，供应商按钮均带 title
    const backBtn = screen.getAllByRole('button').find((b) => !b.getAttribute('title'))!;
    await fireEvent.click(backBtn);

    expect(pushMock).toHaveBeenCalledWith('/model/table');
  });

  it('过滤后清空搜索恢复完整列表', async () => {
    setupProviders();
    render(ModelSidebar, { props: { value: ModelProviderKeyEnum.DEEPSEEK } });

    const input = screen.getByPlaceholderText('搜索模型...');
    await fireEvent.update(input, 'deep');
    await waitFor(() => expect(screen.queryByText('Kimi')).toBeNull());

    await fireEvent.update(input, '');
    await waitFor(() => expect(screen.getByText('Kimi')).toBeVisible());
    expect(screen.getByText('ZhipuAI')).toBeVisible();
  });
});
