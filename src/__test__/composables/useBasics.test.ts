/**
 * 基础 composables 单元测试
 *
 * 覆盖 useDebounce / useAdaptiveScrollbar / useAutoResizeTextarea /
 * useScrollContainer / useResponsive / useExistingModels
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useDebounce } from '@/composables/useDebounce';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';
import { useAutoResizeTextarea } from '@/composables/useAutoResizeTextarea';
import { useScrollContainer } from '@/composables/useScrollContainer';
import { useResponsive } from '@/composables/useResponsive';
import { useExistingModels } from '@/composables/useExistingModels';
import { useModelsStore } from '@/store/models';
import type { Model } from '@/types/model';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      table: { nickname: '昵称' },
      common: { remark: '备注' },
    }).useTranslation(),
}));

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('应该延迟同步新值', async () => {
    const source = ref('a');
    const debounced = useDebounce(source, 100);

    source.value = 'b';
    await vi.advanceTimersByTimeAsync(50);
    expect(debounced.value).toBe('a');

    await vi.advanceTimersByTimeAsync(100);
    expect(debounced.value).toBe('b');
  });

  it('应该支持 getter 形式的来源与初始值', () => {
    const debounced = useDebounce(() => 'initial', 50);
    expect(debounced.value).toBe('initial');
  });
});

describe('useAdaptiveScrollbar', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('滚动时应显示滚动条并在防抖后隐藏', async () => {
    const { isScrolling, scrollbarClassname, onScrollEvent } = useAdaptiveScrollbar({
      hideDebounceMs: 200,
    });

    expect(isScrolling.value).toBe(false);
    expect(scrollbarClassname.value).toBe('scrollbar-none');

    onScrollEvent();
    expect(isScrolling.value).toBe(true);
    expect(scrollbarClassname.value).toBe('scrollbar-thin');

    await vi.advanceTimersByTimeAsync(250);
    expect(isScrolling.value).toBe(false);
    expect(scrollbarClassname.value).toBe('scrollbar-none');
  });

  it('连续滚动应该重置隐藏计时', async () => {
    vi.useRealTimers();
    vi.useFakeTimers();
    const { isScrolling, onScrollEvent } = useAdaptiveScrollbar({ hideDebounceMs: 200 });

    onScrollEvent();
    await vi.advanceTimersByTimeAsync(150);
    onScrollEvent();
    await vi.advanceTimersByTimeAsync(150);
    // 距最后一次滚动不足 200ms，仍应处于滚动状态
    expect(isScrolling.value).toBe(true);

    await vi.advanceTimersByTimeAsync(100);
    expect(isScrolling.value).toBe(false);
  });
});

/** 将模拟 textarea 元素注入组合式函数返回的 textareaRef */
function injectTextarea(
  refs: ReturnType<typeof useAutoResizeTextarea>,
  el: HTMLTextAreaElement,
): void {
  refs.textareaRef.value = el;
}

describe('useAutoResizeTextarea', () => {
  it('textarea 未挂载时不应抛错', async () => {
    const text = ref('');
    const { isScrollable } = useAutoResizeTextarea(text, { minHeight: 60, maxHeight: 240 });

    text.value = '内容';
    await nextTick();

    expect(isScrollable.value).toBe(false);
  });

  it('省略 options 时应使用默认高度配置', async () => {
    const text = ref('');
    const refs = useAutoResizeTextarea(text);

    const el = {
      style: {} as Record<string, string>,
      scrollHeight: 500,
    } as unknown as HTMLTextAreaElement;
    refs.textareaRef.value = el;

    text.value = '超长';
    await nextTick();

    // 默认 maxHeight 192
    expect(el.style.height).toBe('192px');
    expect(refs.isScrollable.value).toBe(true);
  });

  it('应支持 getter 形式的值来源', async () => {
    const source = ref('');
    const { isScrollable } = useAutoResizeTextarea(
      () => source.value,
      { minHeight: 60, maxHeight: 100 },
    );

    const el = {
      style: {} as Record<string, string>,
      scrollHeight: 80,
    } as unknown as HTMLTextAreaElement;
    // 直接注入元素引用（模拟模板绑定）
    (useAutoResizeTextarea as unknown as { __el?: unknown }).__el = el;

    source.value = '内容';
    await nextTick();

    expect(isScrollable.value).toBe(false);
  });

  it('绑定真实 textarea 后应自动调整高度', async () => {
    const text = ref('');
    const { textareaRef, isScrollable } = useAutoResizeTextarea(text, {
      minHeight: 60,
      maxHeight: 100,
    });

    // 模拟 textarea 元素
    const el = {
      style: {} as Record<string, string>,
      scrollHeight: 300,
    } as unknown as HTMLTextAreaElement;
    injectTextarea({ textareaRef, isScrollable }, el);

    text.value = '长内容';
    await nextTick();

    expect(el.style.height).toBe('100px');
    expect(isScrollable.value).toBe(true);
  });
});

describe('useScrollContainer', () => {
  it('应返回滚动条类名与事件回调', () => {
    const { scrollContainerRef, scrollbarClassname, onScrollEvent } = useScrollContainer();

    expect(scrollContainerRef.value).toBeNull();
    expect(typeof onScrollEvent).toBe('function');
    expect(scrollbarClassname.value).toBe('scrollbar-none');
  });
});

describe('useResponsive', () => {
  it('应依据 matchMedia 初始化断点状态', () => {
    const { isMobile, isDesktop, layoutMode } = useResponsive();

    // happy-dom 默认视口 1024px：非移动、非桌面
    expect(isMobile.value).toBe(false);
    expect(layoutMode.value).toBe('compressed');
    expect(isDesktop.value).toBe(false);
  });

  it('四种断点应映射到正确的布局模式', () => {
    const cases: Array<[string, string]> = [
      ['(max-width: 767px)', 'mobile'],
      ['(min-width: 768px) and (max-width: 1023px)', 'compact'],
      ['(min-width: 1024px) and (max-width: 1279px)', 'compressed'],
      ['(min-width: 1280px)', 'desktop'],
    ];

    for (const [hitQuery, expectedMode] of cases) {
      const mmSpy = vi
        .spyOn(window, 'matchMedia')
        .mockImplementation(
          (q) =>
            ({
              matches: q === hitQuery,
              media: q,
              addEventListener: vi.fn(),
              removeEventListener: vi.fn(),
              addListener: vi.fn(),
              removeListener: vi.fn(),
            }) as unknown as MediaQueryList,
        );

      const { layoutMode } = useResponsive();
      expect(layoutMode.value).toBe(expectedMode);

      mmSpy.mockRestore();
    }
  });
});

describe('useBasicModelTable 过滤', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应按昵称/供应商/模型名/备注大小写不敏感过滤', async () => {
    const { useBasicModelTable } = await import('@/composables/useBasicModelTable');
    const modelsStore = useModelsStore();
    modelsStore.models = [
      { id: 'm1', nickname: 'DeepSeek Chat', providerName: 'DeepSeek', modelName: 'deepseek-chat', modelKey: 'deepseek-chat', isDeleted: false, remark: '主力' },
      { id: 'm2', nickname: 'Kimi', providerName: 'Moonshot', modelName: 'moonshot-v1', modelKey: 'moonshot-v1', isDeleted: false },
      { id: 'm3', nickname: '隐藏', providerName: 'X', modelName: 'x', modelKey: 'x', isDeleted: true },
    ] as unknown as Model[];

    const { filterText, filteredModels } = useBasicModelTable();

    // 未过滤：仅未删除模型
    expect(filteredModels.value).toHaveLength(2);

    // 按备注过滤
    filterText.value = '主力';
    await new Promise((r) => setTimeout(r, 250));
    expect(filteredModels.value.map((m) => m.id)).toEqual(['m1']);

    // 按模型名（大小写不敏感）
    filterText.value = 'MOONSHOT-V1';
    await new Promise((r) => setTimeout(r, 250));
    expect(filteredModels.value.map((m) => m.id)).toEqual(['m2']);

    // 无匹配
    filterText.value = '不存在';
    await new Promise((r) => setTimeout(r, 250));
    expect(filteredModels.value).toEqual([]);
  });
});

describe('useExistingModels', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应过滤已删除的模型', () => {
    const modelsStore = useModelsStore();
    modelsStore.models = [
      { id: 'm1', isDeleted: false },
      { id: 'm2', isDeleted: true },
    ] as unknown as Model[];

    const models = useExistingModels();

    expect(models.value).toHaveLength(1);
    expect(models.value[0].id).toBe('m1');
  });
});
