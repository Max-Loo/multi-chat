/**
 * global.ts 模块单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { interceptClickAToJump, getDefaultAppLanguage, LOCAL_STORAGE_LANGUAGE_KEY } from '@/services/global';

// 获取 mock 函数的引用

describe('global.ts 模块测试', () => {
  // 保存全局事件监听器引用，用于测试后清理
  let clickListener: ((event: Event) => void) | null = null;
  let removeClickListener: (() => void) | null = null;

  // Spy 变量
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 清除所有 mocks
    vi.clearAllMocks();
    
    // 清除 localStorage
    localStorage.clear();

    // Mock window.open
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    // Mock navigator.language（locale 函数在 Web 环境中使用它）
    Object.defineProperty(window.navigator, 'language', {
      value: 'zh-CN',
      writable: true,
      configurable: true,
    });

    // 清除 localStorage
    localStorage.clear();

    // Mock addEventListener 来保存 click 事件监听器引用
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    addEventListenerSpy.mockImplementation((event, listener, options) => {
      const originalListener = listener as EventListener;
      if (event === 'click') {
        clickListener = originalListener;
      }
      // 调用原始实现以注册监听器
      return EventTarget.prototype.addEventListener.call(document, event, originalListener, options);
    });

    // 创建 removeEventListener 的清理函数
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    removeEventListenerSpy.mockImplementation((event, listener, options) => {
      if (event === 'click' && listener === clickListener) {
        clickListener = null;
      }
      return EventTarget.prototype.removeEventListener.call(document, event, listener, options);
    });

    // 保存清理函数
    removeClickListener = () => {
      if (clickListener) {
        document.removeEventListener('click', clickListener);
      }
    };
  });

  afterEach(() => {
    // 清理全局事件监听器
    removeClickListener?.();

    // 恢复原始方法
    openSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('getDefaultAppLanguage', () => {
    describe('有效缓存语言测试', () => {
      it('应该直接返回有效的缓存语言', async () => {
        // 设置 localStorage 中的语言
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');

        // 调用函数
        const result = await getDefaultAppLanguage();

        // 验证结果
        expect(result.lang).toBe('zh');
        expect(result.migrated).toBe(false);
        expect(result.from).toBeUndefined();
        expect(result.fallbackReason).toBeUndefined();
      });

      it('应该返回 localStorage 中的英文语言', async () => {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'en');

        const result = await getDefaultAppLanguage();

        expect(result.lang).toBe('en');
        expect(result.migrated).toBe(false);
      });

      it('应该返回 localStorage 中的法语语言', async () => {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'fr');

        const result = await getDefaultAppLanguage();

        expect(result.lang).toBe('fr');
        expect(result.migrated).toBe(false);
      });
    });

    describe('语言代码迁移测试', () => {
      it('应该成功迁移 zh-CN 到 zh', async () => {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh-CN');

        const result = await getDefaultAppLanguage();

        expect(result.lang).toBe('zh');
        expect(result.migrated).toBe(true);
        expect(result.from).toBe('zh-CN');
        expect(result.fallbackReason).toBeUndefined();
        // 验证 localStorage 已更新
        expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('zh');
      });

      it('迁移成功后重复启动应该不再迁移', async () => {
        // 第一次启动：迁移 zh-CN 到 zh
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh-CN');
        const result1 = await getDefaultAppLanguage();
        expect(result1.migrated).toBe(true);
        expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('zh');

        // 第二次启动：直接使用迁移后的 zh
        const result2 = await getDefaultAppLanguage();
        expect(result2.lang).toBe('zh');
        expect(result2.migrated).toBe(false);
        expect(result2.from).toBeUndefined();
      });
    });

    describe('无效缓存清理与降级测试', () => {
      it('应该删除无效缓存并降级到系统语言', async () => {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'de'); // 德语不在支持列表中
        Object.defineProperty(window.navigator, 'language', {
          value: 'fr-FR',
          writable: true,
          configurable: true,
        });

        const result = await getDefaultAppLanguage();

        expect(result.lang).toBe('fr');
        expect(result.migrated).toBe(false);
        expect(result.fallbackReason).toBe('system-lang');
        expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBeNull(); // 缓存已删除
      });

      it('应该删除无效缓存并降级到英文（系统语言不支持）', async () => {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'de'); // 德语不在支持列表中
        Object.defineProperty(window.navigator, 'language', {
          value: 'de-DE',
          writable: true,
          configurable: true,
        }); // 系统语言也不在支持列表中

        const result = await getDefaultAppLanguage();

        expect(result.lang).toBe('en');
        expect(result.migrated).toBe(false);
        expect(result.fallbackReason).toBe('default');
        expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBeNull();
      });

      it('应该删除无效缓存并降级到英文（系统语言为空）', async () => {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'invalid');
        Object.defineProperty(window.navigator, 'language', {
          value: '',
          writable: true,
          configurable: true,
        });

        const result = await getDefaultAppLanguage();

        expect(result.lang).toBe('en');
        expect(result.fallbackReason).toBe('default');
      });
    });

    describe('带地区代码格式测试（不自动迁移）', () => {
      it('缓存语言为 zh-CN 且无迁移规则时，不自动使用 zh', async () => {
        // 注意：当前实现中有 zh-CN -> zh 的迁移规则
        // 这个测试验证如果没有迁移规则时的行为
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh-TW'); // 无迁移规则
        Object.defineProperty(window.navigator, 'language', { value: 'en-US', writable: true, configurable: true });; // 系统语言为英语

        const result = await getDefaultAppLanguage();

        // 应该删除缓存并降级到系统语言
        expect(result.lang).toBe('en');
        expect(result.migrated).toBe(false);
        expect(result.fallbackReason).toBe('system-lang');
        expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBeNull();
      });
    });

    describe('系统语言检测测试', () => {
      it('应该返回支持的系统语言（无缓存时）', async () => {
        localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);
        Object.defineProperty(window.navigator, 'language', { value: 'zh-CN', writable: true, configurable: true });;

        const result = await getDefaultAppLanguage();

        expect(result.lang).toBe('zh');
        expect(result.migrated).toBe(false);
        expect(result.fallbackReason).toBe('system-lang');
      });

      it('应该正确提取系统语言的前缀（en-US -> en）', async () => {
        localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);
        Object.defineProperty(window.navigator, 'language', { value: 'en-US', writable: true, configurable: true });;

        const result = await getDefaultAppLanguage();

        expect(result.lang).toBe('en');
        expect(result.fallbackReason).toBe('system-lang');
      });

      it('应该处理不同格式的系统 locale（zh -> zh）', async () => {
        localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);
        Object.defineProperty(window.navigator, 'language', { value: 'zh', writable: true, configurable: true });;

        const result = await getDefaultAppLanguage();

        expect(result.lang).toBe('zh');
        expect(result.fallbackReason).toBe('system-lang');
      });

      it('应该在不支持的系统语言时回退到 en', async () => {
        localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);
        Object.defineProperty(window.navigator, 'language', { value: 'de-DE', writable: true, configurable: true });;

        const result = await getDefaultAppLanguage();

        expect(result.lang).toBe('en');
        expect(result.fallbackReason).toBe('default');
      });
    });

    describe('localStorage 错误处理测试', () => {
      it('应该在 localStorage 读取失败时降级到系统语言', async () => {
        // Mock localStorage.getItem 抛出异常
        const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('localStorage access denied');
        });
        Object.defineProperty(window.navigator, 'language', { value: 'fr-FR', writable: true, configurable: true });;

        const result = await getDefaultAppLanguage();

        expect(result.lang).toBe('fr');
        expect(result.fallbackReason).toBe('system-lang');

        getItemSpy.mockRestore();
      });

      it('应该在 localStorage 写入失败时仅在内存中更新', async () => {
        // 先设置 localStorage 的初始值
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh-CN');
        
        // 保存原始的 setItem 方法
        const originalSetItem = localStorage.setItem.bind(localStorage);
        
        // Mock localStorage.setItem，当写入 'zh' 时抛出异常（迁移目标）
        const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
          if (key === LOCAL_STORAGE_LANGUAGE_KEY && value === 'zh') {
            throw new Error('localStorage write failed');
          }
          // 其他情况使用原始实现
          return originalSetItem(key, value);
        });

        const result = await getDefaultAppLanguage();

        // 应该仍然迁移成功（仅在内存中）
        expect(result.lang).toBe('zh');
        expect(result.migrated).toBe(true);
        // localStorage 中的值应该还是旧的（写入失败）
        expect(localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY)).toBe('zh-CN');

        setItemSpy.mockRestore();
      });

      it('应该在 localStorage 删除失败时继续正常执行', async () => {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'invalid');
        
        const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
          throw new Error('localStorage remove failed');
        });
        Object.defineProperty(window.navigator, 'language', { value: 'en-US', writable: true, configurable: true });;

        const result = await getDefaultAppLanguage();

        // 应该降级到系统语言，即使删除失败
        expect(result.lang).toBe('en');
        expect(result.fallbackReason).toBe('system-lang');

        removeItemSpy.mockRestore();
      });
    });

    describe('边界情况测试', () => {
      it('应该处理 localStorage 中的空值字符串', async () => {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, '');

        const result = await getDefaultAppLanguage();

        // 空字符串被视为无效，应该回退到系统语言检测
        expect(result.fallbackReason).toBeDefined();
      });

      it('localStorage 优先级应该高于系统语言', async () => {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'en');
        Object.defineProperty(window.navigator, 'language', { value: 'zh-CN', writable: true, configurable: true });;

        const result = await getDefaultAppLanguage();

        expect(result.lang).toBe('en');
        expect(result.migrated).toBe(false);
      });

      it('应该正确处理所有支持的语言', async () => {
        const supportedLanguages = ['zh', 'en', 'fr'];
        
        for (const lang of supportedLanguages) {
          localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, lang);
          const result = await getDefaultAppLanguage();
          expect(result.lang).toBe(lang);
          expect(result.migrated).toBe(false);
        }
      });
    });
  });

  describe('interceptClickAToJump', () => {
    beforeEach(() => {
      // 调用拦截器函数来注册全局监听器
      interceptClickAToJump();
    });

    describe('外部链接拦截测试', () => {
      it('应该拦截外部链接点击并调用 window.open', async () => {
        // 创建外部链接元素
        const anchor = document.createElement('a');
        anchor.href = 'https://external.com';
        document.body.appendChild(anchor);

        // 创建点击事件
        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: anchor, writable: false });

        // 触发事件
        document.dispatchEvent(clickEvent);

        // 等待异步操作完成
        await vi.waitFor(() => {
          expect(openSpy).toHaveBeenCalledWith('https://external.com/', '_blank', expect.any(String));
        });

        // 清理 DOM
        document.body.removeChild(anchor);
      });

      it('应该阻止外部链接的默认导航行为', async () => {
        const anchor = document.createElement('a');
        anchor.href = 'https://example.com';
        document.body.appendChild(anchor);

        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
        Object.defineProperty(clickEvent, 'target', { value: anchor, writable: false });
        vi.spyOn(clickEvent, 'preventDefault');

        document.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
          expect(openSpy).toHaveBeenCalledWith('https://example.com/', '_blank', expect.any(String));
        });
        expect(clickEvent.preventDefault).toHaveBeenCalled();

        document.body.removeChild(anchor);
      });

      it('应该正确处理不同域名的外部链接', async () => {
        const anchor = document.createElement('a');
        anchor.href = 'https://www.external-site.com/path?query=value';
        document.body.appendChild(anchor);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: anchor, writable: false });

        document.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
          expect(openSpy).toHaveBeenCalledWith('https://www.external-site.com/path?query=value', '_blank', expect.any(String));
        });

        document.body.removeChild(anchor);
      });
    });

    describe('内部链接不拦截测试', () => {
      it('不应该拦截内部链接点击', async () => {
        // Mock window.location.origin 为当前 origin
        const currentOrigin = window.location.origin;

        const anchor = document.createElement('a');
        anchor.href = `${currentOrigin}/internal-path`;
        document.body.appendChild(anchor);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: anchor, writable: false });
        const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

        document.dispatchEvent(clickEvent);

        // 等待一下确保没有异步调用
        await vi.waitFor(() => {
          expect(openSpy).not.toHaveBeenCalled();
        }, { timeout: 100 });

        expect(preventDefaultSpy).not.toHaveBeenCalled();

        document.body.removeChild(anchor);
      });

      it('不应该拦截相对路径链接', async () => {
        const anchor = document.createElement('a');
        anchor.href = '/relative/path';
        document.body.appendChild(anchor);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: anchor, writable: false });

        document.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
          expect(openSpy).not.toHaveBeenCalled();
        }, { timeout: 100 });

        document.body.removeChild(anchor);
      });

      it('不应该拦截 hash 链接', async () => {
        const anchor = document.createElement('a');
        anchor.href = '#section';
        document.body.appendChild(anchor);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: anchor, writable: false });

        document.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
          expect(openSpy).not.toHaveBeenCalled();
        }, { timeout: 100 });

        document.body.removeChild(anchor);
      });
    });

    describe('非 a 标签元素忽略测试', () => {
      it('应该忽略非 a 标签的点击', async () => {
        const div = document.createElement('div');
        document.body.appendChild(div);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: div, writable: false });

        document.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
          expect(openSpy).not.toHaveBeenCalled();
        }, { timeout: 100 });

        document.body.removeChild(div);
      });

      it('应该忽略 span 标签的点击', async () => {
        const span = document.createElement('span');
        document.body.appendChild(span);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: span, writable: false });

        document.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
          expect(openSpy).not.toHaveBeenCalled();
        }, { timeout: 100 });

        document.body.removeChild(span);
      });

      it('应该忽略 button 标签的点击', async () => {
        const button = document.createElement('button');
        document.body.appendChild(button);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: button, writable: false });

        document.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
          expect(openSpy).not.toHaveBeenCalled();
        }, { timeout: 100 });

        document.body.removeChild(button);
      });
    });

    describe('嵌套 a 标签识别测试', () => {
      it('应该使用 closest 正确识别嵌套在 a 标签内的子元素', async () => {
        const anchor = document.createElement('a');
        anchor.href = 'https://external.com';
        const span = document.createElement('span');
        anchor.appendChild(span);
        document.body.appendChild(anchor);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: span, writable: false });

        document.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
          expect(openSpy).toHaveBeenCalledWith('https://external.com/', '_blank', expect.any(String));
        });

        document.body.removeChild(anchor);
      });

      it('应该处理多层嵌套的元素', async () => {
        const anchor = document.createElement('a');
        anchor.href = 'https://external.com';
        const div = document.createElement('div');
        const span = document.createElement('span');
        div.appendChild(span);
        anchor.appendChild(div);
        document.body.appendChild(anchor);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: span, writable: false });

        document.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
          expect(openSpy).toHaveBeenCalledWith('https://external.com/', '_blank', expect.any(String));
        });

        document.body.removeChild(anchor);
      });

      it('应该处理点击 a 标签本身的情况', async () => {
        const anchor = document.createElement('a');
        anchor.href = 'https://external.com';
        document.body.appendChild(anchor);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: anchor, writable: false });

        document.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
          expect(openSpy).toHaveBeenCalledWith('https://external.com/', '_blank', expect.any(String));
        });

        document.body.removeChild(anchor);
      });
    });

    describe('边界情况测试', () => {
      it('应该忽略没有 href 属性的 a 标签', async () => {
        const anchor = document.createElement('a');
        anchor.textContent = 'Link without href';
        document.body.appendChild(anchor);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: anchor, writable: false });

        document.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
          expect(openSpy).not.toHaveBeenCalled();
        }, { timeout: 100 });

        document.body.removeChild(anchor);
      });

      it('应该忽略 href 为空字符串的 a 标签', async () => {
        const anchor = document.createElement('a');
        anchor.href = '';
        document.body.appendChild(anchor);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: anchor, writable: false });

        document.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
          expect(openSpy).not.toHaveBeenCalled();
        }, { timeout: 100 });

        document.body.removeChild(anchor);
      });

      it('应该处理无效的 URL（会导致 new URL 抛出异常）', async () => {
        const anchor = document.createElement('a');
        // 设置一个无效的 URL（不是有效的 URL 格式）
        anchor.href = 'not-a-valid-url';
        document.body.appendChild(anchor);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: anchor, writable: false });

        // 这个测试验证函数不会因为无效 URL 而崩溃
        expect(() => {
          document.dispatchEvent(clickEvent);
        }).not.toThrow();

        document.body.removeChild(anchor);
      });

      it('应该处理带有 target 属性的外部链接', async () => {
        const anchor = document.createElement('a');
        anchor.href = 'https://external.com';
        anchor.target = '_blank';
        document.body.appendChild(anchor);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: anchor, writable: false });

        document.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
          expect(openSpy).toHaveBeenCalledWith('https://external.com/', '_blank', expect.any(String));
        });

        document.body.removeChild(anchor);
      });
    });
  });

  describe('全局事件监听器清理逻辑', () => {
    it('应该在 afterEach 中移除事件监听器', () => {
      // 调用拦截器注册监听器
      interceptClickAToJump();

      // 验证监听器已注册
      expect(clickListener).not.toBeNull();

      // 调用清理函数
      removeClickListener?.();

      // 验证清理逻辑不会抛出异常
      expect(() => removeClickListener?.()).not.toThrow();
    });

    it('应该在多次测试中正确隔离事件监听器', async () => {
      // 第一次调用
      interceptClickAToJump();

      const anchor1 = document.createElement('a');
      anchor1.href = 'https://test1.com';
      document.body.appendChild(anchor1);

      const clickEvent1 = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent1, 'target', { value: anchor1, writable: false });

      document.dispatchEvent(clickEvent1);

      await vi.waitFor(() => {
        expect(openSpy).toHaveBeenCalledWith('https://test1.com/', '_blank', expect.any(String));
      });

      document.body.removeChild(anchor1);

      // 清理并重置
      removeClickListener?.();
      openSpy.mockClear();

      // 第二次调用
      interceptClickAToJump();

      const anchor2 = document.createElement('a');
      anchor2.href = 'https://test2.com';
      document.body.appendChild(anchor2);

      const clickEvent2 = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent2, 'target', { value: anchor2, writable: false });

      document.dispatchEvent(clickEvent2);

      await vi.waitFor(() => {
        expect(openSpy).toHaveBeenCalledWith('https://test2.com/', '_blank', expect.any(String));
      });

      document.body.removeChild(anchor2);
    });
  });
});
