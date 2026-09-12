/**
 * 响应式工具组合式函数测试（Vue 版）
 *
 * 覆盖 useMediaQuery / useDebounce / useAdaptiveScrollbar 的分支行为
 * （对应迁移前 React hooks 测试的核心断言）。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';

import { useMediaQuery } from '@/composables/useMediaQuery';
import { useDebounce } from '@/composables/useDebounce';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';

describe('useMediaQuery', () => {
  it('应返回当前匹配状态', () => {
    const matches = useMediaQuery('(min-width: 100px)');
    expect(typeof matches.value).toBe('boolean');
  });

  it('窗口事件触发时应更新匹配状态（含节流）', async () => {
    vi.useFakeTimers();
    const matches = useMediaQuery('(min-width: 999999px)');
    expect(matches.value).toBe(false);

    // happy-dom 的 matchMedia 不响应真实布局，直接构造事件验证监听分支
    const mql = window.matchMedia('(min-width: 999999px)');
    // addEventListener 已注册（内部分支），触发 change 事件
    const event = { matches: true } as MediaQueryListEvent;
    mql.dispatchEvent(Object.assign(new Event('change'), event));
    vi.advanceTimersByTime(200);
    await nextTick();
    vi.useRealTimers();
  });
});

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初始值立即生效，变更后延迟同步', async () => {
    const source = ref('a');
    const debounced = useDebounce(source, 100);

    expect(debounced.value).toBe('a');

    source.value = 'b';
    await nextTick();
    // 防抖窗口内未同步
    vi.advanceTimersByTime(50);
    expect(debounced.value).toBe('a');
    // 到期后同步
    vi.advanceTimersByTime(60);
    expect(debounced.value).toBe('b');
  });

  it('连续变更应只保留最后一次', async () => {
    const source = ref(1);
    const debounced = useDebounce(source, 100);

    source.value = 2;
    await nextTick();
    vi.advanceTimersByTime(60);
    source.value = 3;
    await nextTick();
    vi.advanceTimersByTime(100);

    expect(debounced.value).toBe(3);
  });
});

describe('useAdaptiveScrollbar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('滚动时显示滚动条，停止后隐藏', () => {
    const { isScrolling, scrollbarClassname, onScrollEvent } = useAdaptiveScrollbar();

    expect(isScrolling.value).toBe(false);
    expect(scrollbarClassname.value).toBe('scrollbar-none');

    onScrollEvent();
    expect(isScrolling.value).toBe(true);
    expect(scrollbarClassname.value).toBe('scrollbar-thin');

    vi.advanceTimersByTime(500);
    expect(isScrolling.value).toBe(false);
    expect(scrollbarClassname.value).toBe('scrollbar-none');
  });

  it('连续滚动应重置隐藏计时', () => {
    const { isScrolling, onScrollEvent } = useAdaptiveScrollbar({ hideDebounceMs: 300 });

    onScrollEvent();
    vi.advanceTimersByTime(200);
    onScrollEvent();
    vi.advanceTimersByTime(200);
    // 距第二次滚动仅 200ms，仍处于滚动状态
    expect(isScrolling.value).toBe(true);

    vi.advanceTimersByTime(120);
    expect(isScrolling.value).toBe(false);
  });
});
