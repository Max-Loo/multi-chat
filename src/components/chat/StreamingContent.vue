<script setup lang="ts">
/**
 * 流式内容增量渲染组件（Vue 版）
 *
 * 流式期间将内容按段落边界分割为冻结块和活跃块：
 * - 冻结块 HTML 缓存在 append-only 数组中，v-for 渲染后不再变化（等价于 React memo 冻结块）
 * - 活跃块每次内容更新时重新渲染（内容短，开销小）
 * - 流式结束后执行一次完整渲染确保视觉正确性
 *
 * 重置机制：内容缩短时（编辑回退/重新生成）自动重置冻结块缓存
 */
import { computed, ref, watch } from 'vue';
import { generateCleanHtml } from '@/utils/markdown';
import { findSafeSplitPoint } from '@/utils/markdownSplit';

const props = withDefaults(
  defineProps<{
    /** markdown 内容 */
    content: string;
    /** 是否正在流式生成中 */
    isRunning: boolean;
    /** 外层容器的 className */
    class?: string;
  }>(),
  { isRunning: false },
);

/** 冻结块 HTML 缓存（append-only） */
const frozenBlocks = ref<string[]>([]);
const prevSplitPoint = ref(0);

// 活跃块起点计算（等价于 React 版 useMemo 内的分割逻辑）
const activeStart = computed(() => {
  if (!props.isRunning) {
    return 0;
  }
  const splitPoint = findSafeSplitPoint(props.content);
  const prev = prevSplitPoint.value;

  if (splitPoint < prev) {
    return 0;
  }
  return splitPoint;
});

// 流式结束：完整渲染
const fullHtml = computed(() => {
  if (props.isRunning) return '';
  return generateCleanHtml(props.content);
});

// 冻结块更新：仅当产生新的分割点时追加（append-only，等价于 lastAppendedStartRef 机制）
watch(
  () => [props.content, props.isRunning] as const,
  () => {
    if (!props.isRunning) {
      prevSplitPoint.value = 0;
      frozenBlocks.value = [];
      return;
    }

    const splitPoint = findSafeSplitPoint(props.content);
    const prev = prevSplitPoint.value;

    if (splitPoint < prev) {
      // 内容缩短（编辑回退/重新生成）：重置冻结块缓存
      prevSplitPoint.value = 0;
      frozenBlocks.value = [];
      return;
    }

    if (splitPoint > prev) {
      const newBlock = generateCleanHtml(props.content.slice(prev, splitPoint));
      prevSplitPoint.value = splitPoint;
      frozenBlocks.value.push(newBlock);
    }
  },
  { immediate: true },
);

// 活跃块 HTML
const activeHtml = computed(() => {
  const activeContent = props.content.slice(activeStart.value);
  return generateCleanHtml(activeContent);
});
</script>

<template>
  <!-- 非流式：完整渲染 -->
  <div v-if="!props.isRunning" :class="props.class" v-html="fullHtml" />

  <!-- 流式：冻结块 + 活跃块 -->
  <div v-else :class="props.class">
    <div v-for="(html, i) in frozenBlocks" :key="i" v-html="html" />
    <div v-html="activeHtml" />
  </div>
</template>
