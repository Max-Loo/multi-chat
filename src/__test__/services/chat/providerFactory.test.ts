import { describe, it, expect, vi } from 'vitest';
import { getProvider } from '@/services/chat/providerFactory';
import { ModelProviderKeyEnum } from '@/utils/enums';

// Mock tauriCompat 模块
vi.mock('@/utils/tauriCompat', () => ({
  getFetchFunc: () => {
    return function fetch(): Promise<Response> {
      return Promise.resolve(new Response());
    };
  },
}));

describe('providerFactory', () => {
  it('应该创建 DeepSeek provider', () => {
    const provider = getProvider(
      ModelProviderKeyEnum.DEEPSEEK,
      'sk-test-key',
      'https://api.deepseek.com'
    );
    expect(provider).toBeDefined();
    expect(typeof provider).toBe('function');
  });

  it('应该创建 MoonshotAI provider', () => {
    const provider = getProvider(
      ModelProviderKeyEnum.MOONSHOTAI,
      'sk-test-key',
      'https://api.moonshot.cn/v1'
    );
    expect(provider).toBeDefined();
    expect(typeof provider).toBe('function');
  });

  it('应该创建 ZhipuAI provider', () => {
    const provider = getProvider(
      ModelProviderKeyEnum.ZHIPUAI,
      'sk-test-key',
      'https://open.bigmodel.cn/api/paas/v4'
    );
    expect(provider).toBeDefined();
    expect(typeof provider).toBe('function');
  });

  it('应该创建 ZhipuAI Coding Plan provider', () => {
    const provider = getProvider(
      ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN,
      'sk-test-key',
      'https://open.bigmodel.cn/api/paas/v4'
    );
    expect(provider).toBeDefined();
    expect(typeof provider).toBe('function');
  });

  it('应该在未知供应商时抛出错误', () => {
    expect(() =>
      getProvider('unknown' as ModelProviderKeyEnum, 'sk-test-key', 'https://api.example.com')
    ).toThrow('Unsupported provider: unknown');
  });
});
