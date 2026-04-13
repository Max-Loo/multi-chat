import { describe, it, expect, vi } from 'vitest';
import { getProvider } from '@/services/chat/providerFactory';
import { getProviderSDKLoader } from '@/services/chat/providerLoader';
import { ModelProviderKeyEnum } from '@/utils/enums';

// Mock tauriCompat 模块
vi.mock('@/utils/tauriCompat', () => ({
  getFetchFunc: () => {
    return function fetch(): Promise<Response> {
      return Promise.resolve(new Response());
    };
  },
}));

// Mock providerLoader 模块
vi.mock('@/services/chat/providerLoader', () => ({
  getProviderSDKLoader: vi.fn(() => ({
    loadProvider: vi.fn().mockResolvedValue((config: Record<string, unknown>) => {
      // Mock 返回一个工厂函数
      return (modelId: string) => ({
        modelId,
        provider: 'mock-provider',
        ...config,
      });
    }),
    isProviderLoaded: vi.fn(),
    getProviderState: vi.fn(),
    preloadProviders: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('providerFactory', () => {
  it.each([
    [ModelProviderKeyEnum.DEEPSEEK, 'https://api.deepseek.com'],
    [ModelProviderKeyEnum.MOONSHOTAI, 'https://api.moonshot.cn/v1'],
    [ModelProviderKeyEnum.ZHIPUAI, 'https://open.bigmodel.cn/api/paas/v4'],
    [ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN, 'https://open.bigmodel.cn/api/paas/v4'],
  ])('应该创建 %s provider', async (providerKey, apiUrl) => {
    const provider = await getProvider(providerKey, 'sk-test-key', apiUrl);
    expect(provider).toBeDefined();
    expect(typeof provider).toBe('function');
  });

  it('应该在 SDK 加载失败时抛出包含 providerKey 和 cause 的增强错误', async () => {
    const loadError = new Error('Dynamic import failed');

    vi.mocked(getProviderSDKLoader).mockReturnValueOnce({
      loadProvider: vi.fn().mockRejectedValue(loadError),
      isProviderLoaded: vi.fn(),
      getProviderState: vi.fn(),
      preloadProviders: vi.fn().mockResolvedValue(undefined),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: ProviderSDKLoaderClass 包含 private 成员，测试 mock 只需实现公共接口
    } as any);

    try {
      await getProvider(ModelProviderKeyEnum.DEEPSEEK, 'sk-test-key', 'https://api.deepseek.com');
      expect.unreachable('应该抛出错误');
    } catch (err) {
      const error = err as Error;
      expect(error.message).toContain(`Failed to initialize provider "${ModelProviderKeyEnum.DEEPSEEK}"`);
      expect(error.message).toContain('Dynamic import failed');
      expect(error.cause).toBe(loadError);
    }
  });
});
