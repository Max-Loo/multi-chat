/**
 * 设置域组件测试（转写自 React Setting 域测试）
 *
 * 验证语言切换、自动命名开关、聊天导出、密钥导出与重置入口、供应商卡片展开
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import LanguageSetting from '@/pages/Setting/components/GeneralSetting/components/LanguageSetting.vue';
import AutoNamingSetting from '@/pages/Setting/components/GeneralSetting/components/AutoNamingSetting.vue';
import ChatExportSetting from '@/pages/Setting/components/GeneralSetting/components/ChatExportSetting.vue';
import KeyManagementSetting from '@/pages/Setting/components/KeyManagementSetting/index.vue';
import ProviderCard from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCard.vue';
import { useAppConfigStore } from '@/store/appConfig';
import { useSettingPageStore } from '@/store/settingPage';
import type { RemoteProviderData } from '@/services/modelRemote';
import { ModelProviderKeyEnum } from '@/utils/enums';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      common: {
        language: '语言',
        cancel: '取消',
        hide: '隐藏',
        resetConfirmTitle: '确认重置所有数据',
        resetConfirmDescription: '将清除所有数据',
        resetConfirmAction: '确认重置',
      },
      setting: {
        languageSwitchFailed: '语言切换失败',
        toastTest: 'Toast 测试',
        title: '设置',
        openMenu: '打开菜单',
        generalSetting: '通用设置',
        autoNaming: {
          title: '自动命名',
          description: '自动为新聊天生成标题',
        },
        chatExport: {
          title: '聊天导出',
          description: '导出聊天数据为 JSON',
          exportAll: '导出全部',
          exportDeleted: '导出已删除',
          exportSuccess: '导出成功',
          exportFailed: '导出失败',
          noDeletedChats: '没有已删除的聊天',
        },
        keyManagement: {
          title: '密钥管理',
          exportKey: '导出主密钥',
          exportKeyDescription: '导出后请妥善保管',
          exportKeyDialogDescription: '密钥是敏感信息',
          exportSuccess: '已复制',
          exportFailed: '导出失败',
          copyToClipboard: '复制到剪贴板',
          resetAllData: '重置所有数据',
          resetAllDataDescription: '清除全部本地数据',
        },
        modelProvider: {
          title: '模型供应商',
          description: '管理远程模型数据',
          refreshButton: '刷新',
          refreshing: '刷新中',
          refreshSuccess: '刷新成功',
          refreshFailed: '刷新失败',
          refreshFailedPrefix: '刷新失败：',
          lastUpdateLabel: '最后更新：',
          status: { available: '可用', unavailable: '不可用' },
          modelCount: '{{count}} 个模型',
          clickToViewDetails: '点击查看详情',
          apiEndpoint: 'API 端点',
          providerId: '供应商 ID',
          viewDocs: '查看文档',
          searchPlaceholder: '搜索模型',
          searchResult: '找到 {{count}} 个模型',
          totalModels: '共 {{count}} 个模型',
        },
      },
    }).useTranslation(),
}));

const clipboardMock = vi.hoisted(() => ({ copyToClipboard: vi.fn() }));

const toastMock = vi.hoisted(() => ({
  toastQueue: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/services/toast', () => toastMock);

// Select 受控桩：reka Select 的交互在 happy-dom 中难以驱动，改为原生 select 语义
vi.mock('@/components/ui/select', () => ({
  Select: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      `<select data-testid="lang-select" :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"><slot /></select>`,
  },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: { props: ['value'], template: '<option :value="value"><slot /></option>' },
  SelectTrigger: { template: '<div><slot /></div>' },
  SelectValue: { template: '<span />' },
}));

vi.mock('@/utils/clipboard', () => clipboardMock);

// ---- LanguageSetting ----

describe('LanguageSetting', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('应该渲染语言设置与当前语言', () => {
    const appConfigStore = useAppConfigStore();
    appConfigStore.language = 'zh';

    render(LanguageSetting);

    expect(screen.getByTestId('language-setting')).toBeInTheDocument();
    expect(screen.getByText('语言')).toBeInTheDocument();
  });

  it('切换语言成功时应该更新 store', async () => {
    const appConfigStore = useAppConfigStore();
    appConfigStore.language = 'zh';
    const setSpy = vi
      .spyOn(appConfigStore, 'setAppLanguage')
      .mockResolvedValue();

    render(LanguageSetting);

    await fireEvent.change(screen.getByTestId('lang-select'), { target: { value: 'en' } });

    await waitFor(() => {
      expect(setSpy).toHaveBeenCalledWith('en');
    });
  });

  it('选择相同语言时不应触发切换', async () => {
    const appConfigStore = useAppConfigStore();
    appConfigStore.language = 'zh';
    const setSpy = vi.spyOn(appConfigStore, 'setAppLanguage').mockResolvedValue();

    render(LanguageSetting);

    await fireEvent.change(screen.getByTestId('lang-select'), { target: { value: 'zh' } });

    expect(setSpy).not.toHaveBeenCalled();
  });
});

// ---- AutoNamingSetting ----

describe('AutoNamingSetting', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应该渲染标题与说明', () => {
    render(AutoNamingSetting);

    expect(screen.getByText('自动命名')).toBeInTheDocument();
    expect(screen.getByText('自动为新聊天生成标题')).toBeInTheDocument();
  });

  it('切换开关应该更新 store', async () => {
    const appConfigStore = useAppConfigStore();
    appConfigStore.autoNamingEnabled = false;
    const setSpy = vi.spyOn(appConfigStore, 'setAutoNamingEnabled');

    render(AutoNamingSetting);

    const switchEl = screen.getByRole('switch');
    await fireEvent.click(switchEl);

    expect(setSpy).toHaveBeenCalledWith(true);
  });
});

// ---- ChatExportSetting ----

// URL.createObjectURL 桩（下载流程由浏览器处理）
beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});

describe('ChatExportSetting', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('应该渲染两个导出按钮', () => {
    render(ChatExportSetting);

    expect(screen.getByRole('button', { name: '导出全部' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '导出已删除' })).toBeInTheDocument();
  });

  it('导出全部应该下载 JSON 并提示成功', async () => {
    const chatExportMock = await import('@/services/chatExport');
    vi.spyOn(chatExportMock, 'exportAllChats').mockResolvedValue({ chats: [] } as never);
    const urlSpy = URL.createObjectURL as unknown as ReturnType<typeof vi.fn>;

    render(ChatExportSetting);

    await fireEvent.click(screen.getByRole('button', { name: '导出全部' }));

    await waitFor(() => {
      expect(urlSpy).toHaveBeenCalled();
    });
  });

  it('无已删除聊天时应该提示且不下载', async () => {
    const chatExportMock = await import('@/services/chatExport');
    vi.spyOn(chatExportMock, 'exportDeletedChats').mockResolvedValue({
      chats: [],
    } as never);
    const urlSpy = URL.createObjectURL as unknown as ReturnType<typeof vi.fn>;

    render(ChatExportSetting);

    await fireEvent.click(screen.getByRole('button', { name: '导出已删除' }));

    await waitFor(() => {
      expect(toastMock.toastQueue.info).toHaveBeenCalled();
    });
    expect(urlSpy).not.toHaveBeenCalled();
  });
});

// ---- KeyManagementSetting ----

describe('KeyManagementSetting', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('应该渲染密钥导出与重置入口', () => {
    render(KeyManagementSetting);

    expect(screen.getByText('导出后请妥善保管')).toBeInTheDocument();
    expect(screen.getByText('清除全部本地数据')).toBeInTheDocument();
  });

  it('导出成功后应该展示密钥与复制按钮', async () => {
    const masterKeyMock = await import('@/store/keyring/masterKey');
    vi.spyOn(masterKeyMock, 'exportMasterKey').mockResolvedValue('a'.repeat(64));

    render(KeyManagementSetting);

    // 两个「导出主密钥」：标题 + 按钮，取按钮
    const exportButtons = screen.getAllByRole('button', { name: '导出主密钥' });
    await fireEvent.click(exportButtons[exportButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '复制到剪贴板' })).toBeInTheDocument();
    });

    // 复制成功后对话框关闭
    clipboardMock.copyToClipboard.mockResolvedValue(undefined);
    await fireEvent.click(screen.getByRole('button', { name: '复制到剪贴板' }));

    await waitFor(() => {
      expect(clipboardMock.copyToClipboard).toHaveBeenCalledWith('a'.repeat(64));
    });
  });

  it('点击重置按钮应该打开重置确认对话框', async () => {
    render(KeyManagementSetting);

    const resetButtons = screen.getAllByRole('button', { name: '重置所有数据' });
    await fireEvent.click(resetButtons[resetButtons.length - 1]);
    await nextTick();

    await waitFor(() => {
      expect(screen.getByText('确认重置所有数据')).toBeInTheDocument();
    });
  });
});

// ---- ProviderCard ----

describe('ProviderCard', () => {
  const provider = {
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    providerName: 'DeepSeek',
    api: 'https://api.deepseek.com',
    models: [
      { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
      { modelKey: 'deepseek-coder', modelName: 'DeepSeek Coder' },
    ],
  } as unknown as RemoteProviderData;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('折叠状态应该显示模型数量与点击提示', () => {
    render(ProviderCard, {
      props: { provider, isExpanded: false, status: 'available' },
    });

    expect(screen.getByTestId('provider-card')).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes('2 个模型'))).toBeInTheDocument();
    expect(screen.getByText('点击查看详情')).toBeInTheDocument();
    expect(screen.queryByTestId('provider-card-details')).not.toBeInTheDocument();
  });

  it('点击卡片应该触发 toggle 事件', async () => {
    const onToggle = vi.fn();

    render(ProviderCard, {
      props: { provider, isExpanded: false, status: 'available', onToggle },
    });

    await fireEvent.click(screen.getByTestId('provider-card'));

    expect(onToggle).toHaveBeenCalled();
  });

  it('展开状态应该渲染模型列表', () => {
    render(ProviderCard, {
      props: { provider, isExpanded: true, status: 'available' },
    });

    expect(screen.getByTestId('provider-card-details')).toBeInTheDocument();
    expect(screen.getByText('DeepSeek Chat')).toBeInTheDocument();
    expect(screen.getByText('共 2 个模型')).toBeInTheDocument();
  });

  it('不可用状态应该显示不可用徽标', () => {
    render(ProviderCard, {
      props: {
        provider: { ...provider, models: [] },
        isExpanded: false,
        status: 'unavailable',
      },
    });

    expect(screen.getByText('不可用')).toBeInTheDocument();
  });
});

// ---- SettingPage store 交互 ----

describe('SettingPage 抽屉状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('toggleDrawer 应该切换抽屉状态', () => {
    const settingPageStore = useSettingPageStore();

    expect(settingPageStore.isDrawerOpen).toBe(false);
    settingPageStore.toggleDrawer();
    expect(settingPageStore.isDrawerOpen).toBe(true);
    settingPageStore.setIsDrawerOpen(false);
    expect(settingPageStore.isDrawerOpen).toBe(false);
  });
});
