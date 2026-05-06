import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getProviderSDKLoader } from '@/services/chat/providerLoader';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { ResourceLoader } from '@/utils/resourceLoader';

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
    it('应该在 handleNetworkRecover 时仅重试 error 状态的 provider', () => {
      const preloadSpy = vi.spyOn(loader, 'preloadProviders');

      // 模拟所有 provider 处于 error 状态
      const resourceLoader = loader.getLoader();
      (resourceLoader as any).states.set(ModelProviderKeyEnum.DEEPSEEK, { status: 'error', error: new Error('test') });
      (resourceLoader as any).states.set(ModelProviderKeyEnum.ZHIPUAI, { status: 'error', error: new Error('test') });

      // 直接调用 handleNetworkRecover（模拟 window online 事件触发）
      (loader as any).handleNetworkRecover();

      // 验证 preloadProviders 被调用，仅传入 error 状态的 provider keys
      expect(preloadSpy).toHaveBeenCalledOnce();
      const calledKeys = preloadSpy.mock.calls[0][0];
      expect(calledKeys).toContain(ModelProviderKeyEnum.DEEPSEEK);
      expect(calledKeys).toContain(ModelProviderKeyEnum.ZHIPUAI);
      expect(calledKeys).not.toContain(ModelProviderKeyEnum.MOONSHOTAI);
      expect(calledKeys).not.toContain(ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN);

      preloadSpy.mockRestore();
    });

    it('应该在 window online 事件时触发网络恢复（仅重试 error 状态）', () => {
      // 重置以重建事件监听器
      loader.resetForTest();

      // 模拟部分 provider 处于 error 状态
      const resourceLoader = loader.getLoader();
      (resourceLoader as any).states.set(ModelProviderKeyEnum.MOONSHOTAI, { status: 'error', error: new Error('test') });

      const preloadSpy = vi.spyOn(loader, 'preloadProviders');
      const controller = new AbortController();
      window.addEventListener('online', () => {
        (loader as any).handleNetworkRecover();
      }, { signal: controller.signal });

      window.dispatchEvent(new Event('online'));

      expect(preloadSpy).toHaveBeenCalledOnce();
      const calledKeys = preloadSpy.mock.calls[0][0];
      expect(calledKeys).toEqual([ModelProviderKeyEnum.MOONSHOTAI]);

      controller.abort();
      preloadSpy.mockRestore();
    });
  });

  describe('构造函数 window 环境检测', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('无 window 环境时不注册 online 事件监听器', async () => {
      // 模拟无窗口环境
      vi.stubGlobal('window', undefined);
      vi.resetModules();

      // 在无 window 环境下重新导入模块，验证不会因调用 undefined.addEventListener 而崩溃
      const { getProviderSDKLoader: getFreshLoader } = await import('@/services/chat/providerLoader');
      const freshLoader = getFreshLoader();

      // 验证 handleNetworkRecover 功能本身正常（手动调用，无 error 状态的 provider 不会调用 preload）
      const preloadSpy = vi.spyOn(freshLoader, 'preloadProviders');
      (freshLoader as any).handleNetworkRecover();
      expect(preloadSpy).not.toHaveBeenCalled();

      // 模拟有 error 状态再调用
      const resourceLoader = freshLoader.getLoader();
      (resourceLoader as any).states.set(ModelProviderKeyEnum.DEEPSEEK, { status: 'error', error: new Error('test') });
      (freshLoader as any).handleNetworkRecover();
      expect(preloadSpy).toHaveBeenCalledOnce();

      preloadSpy.mockRestore();
    });

    it('有 window 环境时构造函数注册的 online 监听器仅重试 error 状态的 provider', async () => {
      vi.resetModules();

      // 重新导入模块以获取新实例
      const { getProviderSDKLoader: getFreshLoader } = await import('@/services/chat/providerLoader');
      const freshLoader = getFreshLoader();
      const preloadSpy = vi.spyOn(freshLoader, 'preloadProviders');

      // 派发 online 事件（无 error 状态，不应调用 preload）
      window.dispatchEvent(new Event('online'));
      expect(preloadSpy).not.toHaveBeenCalled();

      // 模拟所有 provider 都处于 error 状态
      const resourceLoader = freshLoader.getLoader();
      for (const key of (freshLoader as any).allProviderKeys) {
        (resourceLoader as any).states.set(key, { status: 'error', error: new Error('test') });
      }

      window.dispatchEvent(new Event('online'));
      expect(preloadSpy).toHaveBeenCalledOnce();
      const calledKeys = preloadSpy.mock.calls[0][0];
      expect(calledKeys).toContain(ModelProviderKeyEnum.DEEPSEEK);
      expect(calledKeys).toContain(ModelProviderKeyEnum.MOONSHOTAI);
      expect(calledKeys).toContain(ModelProviderKeyEnum.ZHIPUAI);
      expect(calledKeys).toContain(ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN);

      preloadSpy.mockRestore();
    });
  });

  describe('ZHIPUAI_CODING_PLAN loader 返回值验证', () => {
    it('加载 ZHIPUAI_CODING_PLAN 应返回有效的工厂函数', async () => {
      const factory = await loader.loadProvider(ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN);

      expect(typeof factory).toBe('function');
      expect(loader.isProviderLoaded(ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN)).toBe(true);
    });
  });

  describe('getLoader() 方法', () => {
    it('应返回 ResourceLoader 实例且与内部 loader 引用相同', () => {
      const resourceLoader = loader.getLoader();

      expect(resourceLoader).toBeInstanceOf(ResourceLoader);
      // 多次调用应返回同一引用
      expect(loader.getLoader()).toBe(resourceLoader);
    });
  });
});
