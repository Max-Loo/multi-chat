/**
 * global.ts 模块单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { interceptClickAToJump, getDefaultAppLanguage, LOCAL_STORAGE_LANGUAGE_KEY } from '@/lib/global';

describe('global.ts 模块测试', () => {
  // 保存全局事件监听器引用，用于测试后清理
  let clickListener: ((event: Event) => void) | null = null;
  let removeClickListener: (() => void) | null = null;

  // Spy 变量
  let languageSpy: ReturnType<typeof vi.spyOn>;
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock navigator.language
    languageSpy = vi.spyOn(navigator, 'language', 'get').mockReturnValue('zh-CN');

    // Mock window.open
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

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
    languageSpy.mockRestore();
    openSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('getDefaultAppLanguage', () => {
    describe('localStorage 优先级测试', () => {
      it('应该返回 localStorage 中的语言（第一优先级）', async () => {
        // 设置 localStorage 中的语言
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'zh');

        // 调用函数
        const result = await getDefaultAppLanguage();

        // 验证结果
        expect(result).toBe('zh');
      });

      it('应该返回 localStorage 中的英文语言', async () => {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'en');

        const result = await getDefaultAppLanguage();

        expect(result).toBe('en');
      });
    });

    describe('系统语言检测测试', () => {
      it('应该返回支持的系统语言前缀（第二优先级）', async () => {
        // 确保 localStorage 中没有语言设置
        localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);

        // Mock 系统语言为中文
        languageSpy.mockReturnValue('zh-CN');

        const result = await getDefaultAppLanguage();

        expect(result).toBe('zh');
      });

      it('应该正确提取系统语言的前缀（en-US -> en）', async () => {
        localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);
        languageSpy.mockReturnValue('en-US');

        const result = await getDefaultAppLanguage();

        expect(result).toBe('en');
      });

      it('应该处理不同格式的系统 locale（zh -> zh）', async () => {
        localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);
        languageSpy.mockReturnValue('zh');

        const result = await getDefaultAppLanguage();

        expect(result).toBe('zh');
      });
    });

    describe('不支持系统语言时的回退测试', () => {
      it('应该在不支持的系统语言时回退到 en', async () => {
        localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);
        languageSpy.mockReturnValue('de-DE'); // 德语不在支持列表中

        const result = await getDefaultAppLanguage();

        expect(result).toBe('en');
      });

      it('应该在系统语言为法语时返回 fr', async () => {
        localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);
        languageSpy.mockReturnValue('fr-FR'); // 法语在支持列表中

        const result = await getDefaultAppLanguage();

        expect(result).toBe('fr');
      });

      it('应该在系统语言为空字符串时回退到 en', async () => {
        localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);
        languageSpy.mockReturnValue('');

        const result = await getDefaultAppLanguage();

        expect(result).toBe('en');
      });
    });

    describe('边界情况测试', () => {
      it('应该处理 localStorage 中的空值字符串', async () => {
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, '');

        await getDefaultAppLanguage();

        // 空字符串被视为 falsy，应该回退到系统语言检测
        expect(languageSpy).toHaveBeenCalled();
      });

      it('应该处理系统 locale 格式异常（没有连字符）', async () => {
        localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);
        languageSpy.mockReturnValue('zh'); // 没有地区代码

        const result = await getDefaultAppLanguage();

        expect(result).toBe('zh');
      });

      it('应该处理系统 locale 只有地区代码的情况', async () => {
        localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);
        languageSpy.mockReturnValue('-CN'); // 异常格式

        const result = await getDefaultAppLanguage();

        // split('-')[0] 会返回空字符串，不在支持列表中
        expect(result).toBe('en');
      });

      it('localStorage 优先级应该高于系统语言', async () => {
        // 设置 localStorage 为英文
        localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, 'en');
        // Mock 系统语言为中文
        languageSpy.mockReturnValue('zh-CN');

        const result = await getDefaultAppLanguage();

        // 应该返回 localStorage 中的值，而不是系统语言
        expect(result).toBe('en');
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
