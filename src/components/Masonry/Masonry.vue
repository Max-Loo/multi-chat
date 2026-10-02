<script lang="ts">
/**
 * 瀑布流布局组件（对应旧版 react-masonry-css 的行为，替代其依赖）
 *
 * - 分列算法与 react-masonry-css 对等：按顺序 round-robin 分配到列
 * - 断点语义按 masonry-layout spec 场景实现（min-width）：窗口宽度 ≥ 断点值时采用该断点列数
 *   （注：react-masonry-css 实际为 max-width 语义，与其文档相悖，此处以 spec 契约为准）
 * - resize 使用 requestAnimationFrame 防抖重算列数
 */
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  type PropType,
  type VNode,
} from 'vue';

/** 默认列数（与 react-masonry-css 一致） */
const DEFAULT_COLUMNS = 2;

export default defineComponent({
  name: 'Masonry',

  props: {
    /**
     * 响应式列数配置
     * - number：固定列数
     * - 对象：{ default: 列数, [断点px]: 列数 }，min-width 语义
     */
    breakpointCols: {
      type: [Number, Object] as PropType<number | Record<string | number, number>>,
      default: DEFAULT_COLUMNS,
    },
    /** 容器类名 */
    className: { type: String, default: undefined },
    /** 列容器类名 */
    columnClassName: { type: String, default: undefined },
  },

  setup(props, { slots }) {
    // 窗口宽度响应式跟踪（rAF 防抖，与旧实现一致）
    const windowWidth = ref<number>(
      typeof window !== 'undefined'
        ? window.innerWidth
        : Number.POSITIVE_INFINITY,
    );

    let rafId = 0;

    /** 窗口尺寸变化处理（rAF 防抖） */
    const handleResize = (): void => {
      if (typeof window === 'undefined') return;
      if (window.cancelAnimationFrame) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        windowWidth.value = window.innerWidth;
      });
    };

    onMounted(() => {
      window.addEventListener('resize', handleResize);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      if (window.cancelAnimationFrame) {
        window.cancelAnimationFrame(rafId);
      }
    });

    /**
     * 根据窗口宽度解析当前列数（min-width 语义：取命中的最大断点）
     */
    const resolveColumnCount = (): number => {
      const config = props.breakpointCols;

      // 数字配置：固定列数
      if (typeof config === 'number') {
        return Math.max(1, config || 1);
      }

      // 对象配置：default 起底，命中 width >= key 的最大 key
      let matchedBreakpoint = Number.NEGATIVE_INFINITY;
      let columns = config.default ?? DEFAULT_COLUMNS;

      for (const key of Object.keys(config)) {
        const breakpoint = Number.parseInt(key, 10);
        if (!Number.isFinite(breakpoint) || breakpoint <= 0) continue;
        const isCurrentBreakpoint = windowWidth.value >= breakpoint;
        if (isCurrentBreakpoint && breakpoint > matchedBreakpoint) {
          matchedBreakpoint = breakpoint;
          columns = config[key];
        }
      }

      return Math.max(1, Number.parseInt(String(columns), 10) || 1);
    };

    /**
     * 收集插槽内容并按顺序 round-robin 分配到各列
     */
    const collectItemsInColumns = (): VNode[][] => {
      const count = resolveColumnCount();
      const items = slots.default?.() ?? [];
      const columns: VNode[][] = Array.from({ length: count }, () => []);
      for (let i = 0; i < items.length; i++) {
        columns[i % count].push(items[i]);
      }
      return columns;
    };

    return () => {
      const childrenInColumns = collectItemsInColumns();
      const columnWidth = `${100 / childrenInColumns.length}%`;

      return h(
        'div',
        { class: props.className },
        childrenInColumns.map((items, index) =>
          h(
            'div',
            {
              key: index,
              class: props.columnClassName,
              style: { width: columnWidth },
            },
            items,
          ),
        ),
      );
    };
  },
});
</script>
