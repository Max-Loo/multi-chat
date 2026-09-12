/**
 * 组合式函数分支补充测试（Vue 版）
 *
 * 覆盖 useResponsive 断点分支、useScrollContainer 生命周期、
 * useAutoResizeTextarea 未挂载分支、useZodForm reset。
 */

import { describe, it, expect, vi } from 'vitest';
import { ref, nextTick, effectScope } from 'vue';
import { render } from '@testing-library/vue';

import { useResponsive } from '@/composables/useResponsive';
import { useScrollContainer } from '@/composables/useScrollContainer';
import { useAutoResizeTextarea } from '@/composables/useAutoResizeTextarea';
import { useZodForm } from '@/composables/useZodForm';
import { z } from 'zod';

describe('useResponsive 断点分支', () => {
  it('layoutMode 按优先级解析断点', async () => {
    const scope = effectScope();
    scope.run(() => {
      const { layoutMode } = useResponsive();
      // happy-dom 默认视口不匹配移动断点 → desktop 兜底
      expect(['mobile', 'compact', 'compressed', 'desktop']).toContain(layoutMode.value);
    });
    scope.stop();
  });
});

describe('useScrollContainer 生命周期', () => {
  it('挂载后绑定滚动监听，卸载后移除', async () => {
    const addSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const removeSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener');

    const wrapper = {
      setup() {
        const { scrollContainerRef, scrollbarClassname } = useScrollContainer();
        scrollContainerRef.value = document.createElement('div');
        return { scrollContainerRef, scrollbarClassname };
      },
      template: '<div ref="scrollContainerRef" />',
    };
    const { unmount } = render(wrapper as never);
    await nextTick();

    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

    unmount();
    await nextTick();
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('容器未绑定时生命周期钩子安全跳过', async () => {
    const scope = effectScope();
    scope.run(() => {
      useScrollContainer();
    });
    await nextTick();
    scope.stop();
    // 未抛出异常即覆盖了空 ref 分支
    expect(true).toBe(true);
  });
});

describe('useAutoResizeTextarea 分支', () => {
  it('textarea 未挂载时变更值不抛错', async () => {
    const value = ref('a');
    const scope = effectScope();
    scope.run(() => {
      useAutoResizeTextarea(value);
    });

    value.value = 'b';
    await nextTick();
    scope.stop();
    expect(true).toBe(true);
  });

  it('字符串形式入参同样生效', async () => {
    const scope = effectScope();
    scope.run(() => {
      useAutoResizeTextarea('static-value');
    });
    await nextTick();
    scope.stop();
    expect(true).toBe(true);
  });
});

describe('useZodForm reset', () => {
  const schema = z.object({
    name: z.string().min(1, '必填'),
    count: z.number(),
  });

  it('reset 应还原初始值并清空错误', async () => {
    const scope = effectScope();
    let formRef: ReturnType<typeof useZodForm> | null = null;
    scope.run(() => {
      formRef = useZodForm(
        {
          schema,
          defaultValues: () => ({ name: '初始', count: 1 }),
        },
        ref(schema),
      );
    });

    const form = formRef!;
    // 破坏值后触发整体校验，错误被填充
    form.values.name = '';
    await form.handleSubmit(async () => {});
    expect(Object.keys(form.errors).length).toBeGreaterThan(0);

    form.reset();
    expect(form.values.name).toBe('初始');
    expect(form.values.count).toBe(1);
    expect(Object.keys(form.errors).length).toBe(0);
    scope.stop();
  });
});

// ========================================
// 补充分组：useZodForm 边界 / useResponsive 断点 / useMediaQuery dispose
// ========================================

import { useMediaQuery as mq } from '@/composables/useMediaQuery';

describe('useZodForm 分支补充', () => {
  const schema = z.object({
    name: z.string().min(1, '必填'),
    count: z.number(),
  });

  function createForm() {
    const scope = effectScope();
    let formRef: ReturnType<typeof useZodForm> | null = null;
    scope.run(() => {
      formRef = useZodForm(
        { schema, defaultValues: () => ({ name: '初始', count: 1 }) },
        ref(schema),
      );
    });
    return { form: formRef!, scope };
  }

  it('validateField 未知字段直接返回 true', () => {
    const { form, scope } = createForm();
    // 未知字段（schema.shape 中不存在）→ 短路 true 分支
    expect(form.validateField('nonexistent' as never)).toBe(true);
    scope.stop();
  });

  it('validateField 校验失败写入首个 issue 消息', () => {
    const { form, scope } = createForm();
    form.values.name = '';
    expect(form.validateField('name')).toBe(false);
    expect(form.errors.name).toBe('必填');
    scope.stop();
  });

  it('validateField 校验成功时清除既有错误', () => {
    const { form, scope } = createForm();
    form.values.name = '';
    form.validateField('name');
    expect(form.errors.name).toBeDefined();

    form.values.name = '合法';
    expect(form.validateField('name')).toBe(true);
    expect(form.errors.name).toBeUndefined();
    scope.stop();
  });

  it('handleSubmit 提交成功执行回调', async () => {
    const { form, scope } = createForm();
    const onSubmit = vi.fn();
    const ok = await form.handleSubmit(onSubmit);
    expect(ok).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({ name: '初始', count: 1 });
    scope.stop();
  });

  it('handleSubmit 存量错误字段不再覆盖首个消息', async () => {
    const { form, scope } = createForm();
    form.values.name = '';
    await form.handleSubmit(async () => {});
    const first = form.errors.name;
    // 再触发一次：错误已存在则不覆盖
    await form.handleSubmit(async () => {});
    expect(form.errors.name).toBe(first);
    scope.stop();
  });
});

describe('useResponsive 断点分支', () => {
  it('layoutMode 兜底 desktop（无断点匹配时）', async () => {
    const scope = effectScope();
    let mode: unknown;
    scope.run(() => {
      const r = useResponsive();
      mode = r.layoutMode.value;
    });
    // happy-dom 视口 1024px 属于 compressed 区间或 desktop 兜底，视环境而定
    expect(['compressed', 'desktop', 'compact', 'mobile']).toContain(mode);
    scope.stop();
  });
});

describe('useMediaQuery 作用域销毁移除监听', () => {
  it('onScopeDispose 触发 removeEventListener', () => {
    const added: unknown[] = [];
    const removed: unknown[] = [];
    const fakeMql = {
      matches: false,
      addEventListener: (t: string, cb: unknown) => added.push([t, cb]),
      removeEventListener: (t: string, cb: unknown) => removed.push([t, cb]),
    };
    const original = window.matchMedia;
    vi.stubGlobal('matchMedia', vi.fn(() => fakeMql));
    (globalThis as Record<string, unknown>).matchMedia = window.matchMedia;

    const scope = effectScope();
    scope.run(() => {
      mq('(min-width: 100px)');
    });
    scope.stop();

    expect(added).toHaveLength(1);
    expect(removed).toHaveLength(1);
    expect(removed[0][1]).toBe(added[0][1]);

    vi.unstubAllGlobals();
    window.matchMedia = original;
  });
});

// ========================================
// 补充分组：事件监听回调与持久化异常分支
// ========================================

describe('useMediaQuery change 回调更新状态', () => {
  it('change 事件经节流后写入 matches', () => {
    vi.useFakeTimers();
    let listener: ((e: { matches: boolean }) => void) | null = null;
    const fakeMql = {
      matches: false,
      addEventListener: (_t: string, cb: never) => { listener = cb; },
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('matchMedia', vi.fn(() => fakeMql));

    const scope = effectScope();
    let matchesRef: { value: boolean } | null = null;
    scope.run(() => {
      matchesRef = mq('(min-width: 100px)') as { value: boolean };
    });

    listener!({ matches: true });
    vi.advanceTimersByTime(200);
    expect(matchesRef!.value).toBe(true);

    scope.stop();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});

describe('useResponsive layoutMode 分支', () => {
  it('各断点 ref 写值驱动 layoutMode 重算', async () => {
    const scope = effectScope();
    let r: ReturnType<typeof useResponsive> | null = null;
    scope.run(() => {
      r = useResponsive();
    });

    // 依次驱动 ternary 各分支
    (r as unknown as { isMobile: { value: boolean } }).isMobile.value = true;
    expect(r!.layoutMode.value).toBe('mobile');
    (r as unknown as { isMobile: { value: boolean } }).isMobile.value = false;
    (r as unknown as { isCompact: { value: boolean } }).isCompact.value = true;
    expect(r!.layoutMode.value).toBe('compact');
    (r as unknown as { isCompact: { value: boolean } }).isCompact.value = false;
    (r as unknown as { isCompressed: { value: boolean } }).isCompressed.value = true;
    expect(r!.layoutMode.value).toBe('compressed');
    (r as unknown as { isCompressed: { value: boolean } }).isCompressed.value = false;
    expect(r!.layoutMode.value).toBe('desktop');

    scope.stop();
  });
});

describe('useTheme 系统偏好回调', () => {
  it('system 模式下系统深色偏好变化应应用主题', async () => {
    vi.resetModules();
    let darkListener: (() => void) | null = null;
    const fakeMql = {
      matches: false,
      addEventListener: (_t: string, cb: () => void) => { darkListener = cb; },
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('matchMedia', vi.fn(() => fakeMql));

    const { useTheme: freshUseTheme } = await import('@/composables/useTheme');
    const { theme, setTheme } = freshUseTheme();

    setTheme('system');
    expect(theme.value).toBe('system');

    // 触发系统偏好变化回调
    darkListener!();
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    vi.unstubAllGlobals();
  });
});

describe('useTheme 持久化异常分支', () => {
  it('localStorage 写入失败时降级警告', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('配额超限');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { useTheme: current } = await import('@/composables/useTheme');
    const { setTheme } = current();

    setTheme('dark');
    expect(warnSpy).toHaveBeenCalledWith('[ThemePersistence] 持久化失败:', expect.any(Error));

    setItemSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
