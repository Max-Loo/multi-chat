/**
 * virtua（Vue 版）虚拟滚动 Mock 工厂
 *
 * 提供 MockVirtualizer / MockVList 组件，支持：
 * - 模拟虚拟化渲染（只渲染可见范围内的数据项）
 * - scrollToIndex（align: 'end' 时将 scrollTop 置为 scrollHeight）
 * - 渲染项数量追踪
 *
 * 供 mock('virtua/vue') 使用（ChatSidebar 的 VList 与 Detail 的 Virtualizer）。
 */
import { defineComponent, h, type PropType, type Slot } from 'vue';
import { vi } from 'vitest';

/** Mock 配置参数 */
export interface VirtuaVueMockConfig {
  /** 视口高度（默认 600） */
  viewportHeight: number;
  /** 每项高度（默认 80） */
  itemHeight: number;
  /** 超出视口的渲染项数（默认 2） */
  overscan: number;
}

/** 工厂返回值 */
export interface VirtuaVueMockResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MockVirtualizer: ReturnType<typeof defineComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MockVList: ReturnType<typeof defineComponent>;
  /** 模拟滚动到指定索引（触发 onScroll 回调） */
  scrollTo: (index: number) => void;
  /** 获取当前渲染的可见范围 */
  getRenderedRange: () => { startIndex: number; endIndex: number };
}

/**
 * 创建 virtua Vue 版 Mock 组件与测试辅助函数
 * @param config 虚拟化配置参数
 */
export function createVirtuaVueMock(
  config?: Partial<VirtuaVueMockConfig>,
): VirtuaVueMockResult {
  const mergedConfig: VirtuaVueMockConfig = {
    viewportHeight: 600,
    itemHeight: 80,
    overscan: 2,
    ...config,
  };

  const initialVisibleCount = Math.ceil(
    mergedConfig.viewportHeight / mergedConfig.itemHeight,
  );
  // 闭包状态：当前可见范围
  const state = {
    startIndex: 0,
    endIndex: Math.max(0, initialVisibleCount - 1 + mergedConfig.overscan),
  };
  // 最近一次注册的 scroll 回调
  let latestOnScroll: ((offset: number) => void) | null = null;
  // 最近一次传入的滚动容器（scroll-ref）
  let latestScrollContainer: HTMLElement | null = null;

  /** 计算当前应渲染的数据切片 */
  const sliceData = <T,>(data: T[]): T[] =>
    data.slice(
      Math.max(0, state.startIndex),
      Math.min(data.length - 1, state.endIndex) + 1,
    );

  /**
   * Mock Virtualizer（对应 virtua/vue 的 Virtualizer）
   * props：data / startMargin / scrollRef；插槽：default({ item })；事件：scroll
   */
  const MockVirtualizer = defineComponent({
    name: 'MockVirtualizer',
    props: {
      data: { type: Array as PropType<unknown[]>, required: true },
      startMargin: { type: Number, default: 0 },
      scrollRef: { type: Object as PropType<HTMLElement | null>, default: null },
    },
    emits: ['scroll'],
    setup(props, { slots, emit, expose }) {
      const scrollToIndex = vi.fn(
        (index: number, opts?: { align?: 'start' | 'center' | 'end' }) => {
          void index;
          if (opts?.align === 'end' && latestScrollContainer) {
            latestScrollContainer.scrollTop = latestScrollContainer.scrollHeight;
          }
        },
      );
      expose({ scrollToIndex });

      return () => {
        // 记录 scroll 回调与滚动容器（每次渲染刷新）
        latestOnScroll = (offset: number) => emit('scroll', offset);
        latestScrollContainer = props.scrollRef;
        const items = sliceData(props.data);
        return h(
          'div',
          { 'data-testid': 'mock-virtualizer' },
          items.map((item, index) =>
            (slots.default as Slot)({ item, index }),
          ),
        );
      };
    },
  });

  /**
   * Mock VList（对应 virtua/vue 的 VList）
   * props：data / class / style；插槽：default({ item })；事件：scroll
   */
  const MockVList = defineComponent({
    name: 'MockVList',
    props: {
      data: { type: Array as PropType<unknown[]>, required: true },
    },
    emits: ['scroll'],
    setup(props, { slots, emit, attrs }) {
      return () => {
        latestOnScroll = (offset: number) => emit('scroll', offset);
        const items = sliceData(props.data);
        return h(
          'div',
          {
            ...(attrs as Record<string, unknown>),
            'data-testid': 'mock-vlist',
          },
          items.map((item, index) =>
            (slots.default as Slot)({ item, index }),
          ),
        );
      };
    },
  });

  return {
    MockVirtualizer,
    MockVList,
    scrollTo: (index: number) => {
      state.startIndex = index;
      state.endIndex = index + initialVisibleCount - 1 + mergedConfig.overscan;
      latestOnScroll?.(index * mergedConfig.itemHeight);
    },
    getRenderedRange: () => ({
      startIndex: state.startIndex,
      endIndex: state.endIndex,
    }),
  };
}
