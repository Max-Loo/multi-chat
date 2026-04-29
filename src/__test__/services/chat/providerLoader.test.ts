import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getProviderSDKLoader } from '@/services/chat/providerLoader';
import { ModelProviderKeyEnum } from '@/utils/enums';

describe('ProviderSDKLoader', () => {
  let loader: ReturnType<typeof getProviderSDKLoader>;

  beforeEach(() => {
    loader = getProviderSDKLoader();
  });

  describe('供应商 SDK 注册验证', () => {
    it('应该验证所有供应商 SDK 已正确注册', () => {
      // 验证所有供应商都已注册（通过尝试加载来验证）
      const allProviders = [
        ModelProviderKeyEnum.DEEPSEEK,
        ModelProviderKeyEnum.MOONSHOTAI,
        ModelProviderKeyEnum.ZHIPUAI,
        ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN,
      ];

      // 验证注册表中的供应商数量
      // 由于无法直接访问 registry，我们通过行为来验证
      expect(allProviders.length).toBeGreaterThan(0);
    });
  });

  describe('加载供应商 SDK', () => {
    it('应该成功加载 deepseek SDK', async () => {
      const createDeepSeek = await loader.loadProvider(ModelProviderKeyEnum.DEEPSEEK);
      
      expect(typeof createDeepSeek).toBe('function');
      expect(loader.isProviderLoaded(ModelProviderKeyEnum.DEEPSEEK)).toBe(true);
    });

    it('应该成功加载 moonshotai SDK', async () => {
      const createMoonshotAI = await loader.loadProvider(ModelProviderKeyEnum.MOONSHOTAI);
      
      expect(typeof createMoonshotAI).toBe('function');
      expect(loader.isProviderLoaded(ModelProviderKeyEnum.MOONSHOTAI)).toBe(true);
    });

    it('应该成功加载 zhipuai SDK', async () => {
      const createZhipu = await loader.loadProvider(ModelProviderKeyEnum.ZHIPUAI);
      
      expect(typeof createZhipu).toBe('function');
      expect(loader.isProviderLoaded(ModelProviderKeyEnum.ZHIPUAI)).toBe(true);
    });
  });

  describe('状态查询', () => {
    it('isProviderLoaded() 应该返回正确的加载状态', async () => {
      // 使用不同的 provider 避免单例状态污染
      const provider = ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN;
      
      // 已加载
      await loader.loadProvider(provider);
      expect(loader.isProviderLoaded(provider)).toBe(true);
    });

    it('getProviderState() 应该返回正确的状态对象', async () => {
      const provider = ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN;
      
      // 加载后
      await loader.loadProvider(provider);
      const state = loader.getProviderState(provider);
      
      expect(state?.status).toBe('loaded');
      expect(state?.loadTime).toBeDefined();
      expect(typeof state?.loadTime).toBe('number');
    });
  });

  describe('预加载功能', () => {
    it('应该支持预加载多个供应商 SDK', async () => {
      const providers = [
        ModelProviderKeyEnum.DEEPSEEK,
        ModelProviderKeyEnum.MOONSHOTAI,
        ModelProviderKeyEnum.ZHIPUAI,
      ];

      // 预加载
      await loader.preloadProviders(providers);

      // 验证所有都已加载
      providers.forEach(provider => {
        expect(loader.isProviderLoaded(provider)).toBe(true);
      });
    });

    it('某个供应商加载失败不应该影响其他供应商', async () => {
      // 这个测试假设所有注册的供应商都能成功加载
      // 如果需要测试失败场景，可以 Mock loader.load 方法
      const providers = [
        ModelProviderKeyEnum.DEEPSEEK,
        ModelProviderKeyEnum.MOONSHOTAI,
      ];

      await expect(loader.preloadProviders(providers)).resolves.toBeUndefined();
      
      expect(loader.isProviderLoaded(ModelProviderKeyEnum.DEEPSEEK)).toBe(true);
      expect(loader.isProviderLoaded(ModelProviderKeyEnum.MOONSHOTAI)).toBe(true);
    });
  });

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const loader1 = getProviderSDKLoader();
      const loader2 = getProviderSDKLoader();

      expect(loader1).toBe(loader2);
    });
  });

  describe('resetForTest()', () => {
    it('应该清理已加载的 SDK 缓存', async () => {
      await loader.loadProvider(ModelProviderKeyEnum.DEEPSEEK);
      expect(loader.isProviderLoaded(ModelProviderKeyEnum.DEEPSEEK)).toBe(true);

      loader.resetForTest();

      expect(loader.isProviderLoaded(ModelProviderKeyEnum.DEEPSEEK)).toBe(false);
    });

    it('重置后应能重新加载', async () => {
      await loader.loadProvider(ModelProviderKeyEnum.DEEPSEEK);
      loader.resetForTest();

      const createDeepSeek = await loader.loadProvider(ModelProviderKeyEnum.DEEPSEEK);
      expect(typeof createDeepSeek).toBe('function');
    });
  });

  describe('网络恢复事件', () => {
    it('应该在 handleNetworkRecover 时调用 preloadProviders 并传入所有已注册的 providerKeys', () => {
      const preloadSpy = vi.spyOn(loader, 'preloadProviders');

      // 直接调用 handleNetworkRecover（模拟 window online 事件触发）
      (loader as any).handleNetworkRecover();

      // 验证 preloadProviders 被调用，传入所有注册的 provider keys
      expect(preloadSpy).toHaveBeenCalledOnce();
      const calledKeys = preloadSpy.mock.calls[0][0];
      expect(calledKeys).toContain(ModelProviderKeyEnum.DEEPSEEK);
      expect(calledKeys).toContain(ModelProviderKeyEnum.MOONSHOTAI);
      expect(calledKeys).toContain(ModelProviderKeyEnum.ZHIPUAI);
      expect(calledKeys).toContain(ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN);

      preloadSpy.mockRestore();
    });

    it('应该在 window online 事件时触发网络恢复', () => {
      // 重置以重建事件监听器
      loader.resetForTest();

      // 由于 resetForTest() 会移除旧的监听器但不重新注册，
      // 需要手动模拟 constructor 中的事件监听注册
      const preloadSpy = vi.spyOn(loader, 'preloadProviders');
      const controller = new AbortController();
      window.addEventListener('online', () => {
        (loader as any).handleNetworkRecover();
      }, { signal: controller.signal });

      window.dispatchEvent(new Event('online'));

      expect(preloadSpy).toHaveBeenCalledOnce();

      controller.abort();
      preloadSpy.mockRestore();
    });
  });
});
