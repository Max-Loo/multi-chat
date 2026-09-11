<script setup lang="ts">
/**
 * 瀑布流网格（Vue 版）
 * 使用 CSS columns 实现（与 React 版 react-masonry-css 的 CSS 方案等价）
 */
import { computed } from 'vue';
import { cn } from '@/utils/utils';

const props = withDefaults(
  defineProps<{
    /** 列数 */
    cols?: number;
    /** 列间距（像素） */
    gap?: number;
    class?: string;
  }>(),
  { cols: 3, gap: 16 },
);

const style = computed(() => ({
  columnCount: props.cols,
  columnGap: `${props.gap}px`,
}));

const itemStyle = computed(() => ({
  marginBottom: `${props.gap}px`,
  breakInside: 'avoid',
}));
</script>

<template>
  <div :class="cn('w-full', props.class)" :style="style" data-testid="masonry-grid">
    <div v-for="slot in ($slots.default ? [$slots.default()] : [])" :key="1">
      <!-- Vue 3 不提供直接子元素计数，由调用方保证 item 结构 -->
      <template v-for="(child, i) in slot" :key="i">
        <div :style="itemStyle">
          <component :is="child" />
        </div>
      </template>
    </div>
  </div>
</template>
