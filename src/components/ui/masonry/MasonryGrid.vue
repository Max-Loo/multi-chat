<script lang="ts" setup>
import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'

/**
 * 瀑布流布局组件（CSS multi-column 实现）
 *
 * 替代 react-masonry-css（其本身即 JS 分列的薄封装）：
 * - 通过 column-count 实现多列布局
 * - 断点配置与 react-masonry-css 的 breakpointCols 语义一致（键为 min-width 像素，'default' 为兜底列数）
 * - 子项由调用方提供，建议配合 break-inside-avoid 防止卡片被截断
 */
interface MasonryGridProps {
  /**
   * 响应式列数配置
   * 键为生效的最小视口宽度（像素）或 'default'，值为列数
   * 断点命中规则：取所有已命中的最大 min-width 对应列数
   */
  breakpointCols?: Record<string | number, number>
}

const props = withDefaults(defineProps<MasonryGridProps>(), {
  breakpointCols: () => ({ default: 1 }),
})

// 响应式视口宽度
const { width } = useWindowSize()

/**
 * 当前应使用的列数
 */
const columns = computed<number>(() => {
  const entries = Object.entries(props.breakpointCols)
    .map(([key, cols]) => [key === 'default' ? 0 : Number(key), cols] as const)
    .sort((a, b) => a[0] - b[0])

  let result = 1
  for (const [minWidth, cols] of entries) {
    if (width.value >= minWidth) {
      result = cols
    }
  }
  return result
})

const containerStyle = computed(() => ({
  columnCount: columns.value,
  columnGap: '1rem',
}))
</script>

<template>
  <div class="w-full" :style="containerStyle" data-testid="masonry-grid">
    <slot />
  </div>
</template>
