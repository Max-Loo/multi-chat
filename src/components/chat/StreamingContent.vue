<script setup lang="ts">
/**
 * 流式内容增量渲染组件（对应旧版 chat/StreamingContent.tsx）
 *
 * 流式期间将内容按段落边界分割为冻结块和活跃块：
 * - 冻结块渲染一次后 HTML 缓存进 append-only 数组，v-memo 跳过重渲染
 * - 活跃块每次内容更新时重新渲染（内容短，开销小）
 * - 流式结束后执行一次完整渲染确保视觉正确性
 * - 内容缩短时（编辑回退/重新生成）自动重置冻结块缓存
 */
import { computed, ref, watch } from 'vue';
import { generateCleanHtml } from '@/utils/markdown';
import { findSafeSplitPoint } from '@/utils/markdownSplit';

/** 组件属性 */
const props = withDefaults(
  defineProps<{
    /** markdown 内容 */
    content: string;
    /** 是否正在流式生成中 */
    isRunning?: boolean;
    /** 外层容器的类名 */
    className?: string;
  }>(),
  { isRunning: false, className: '' },
);

// 冻结块 HTML 缓存（append-only）
const frozenBlocks = ref<string[]>([]);
// 上一次切分点（splitPoint 未推进时 watch 已提前返回，天然去重）
let prevSplitPoint = 0;

// 非流式时的完整 HTML
const fullHtml = computed(() => {
  if (props.isRunning) return '';
  return generateCleanHtml(props.content);
});

watch(
  () => [props.content, props.isRunning] as const,
  ([content, isRunning]) => {
    // 流式结束或刚进入流式：重置缓存
    if (!isRunning) {
      prevSplitPoint = 0;
      frozenBlocks.value = [];
      return;
    }

    const splitPoint = findSafeSplitPoint(content);

    if (splitPoint < prevSplitPoint) {
      // 内容缩短（编辑回退/重新生成）：重置
      prevSplitPoint = 0;
      frozenBlocks.value = [];
      return;
    }

    if (splitPoint === prevSplitPoint) {
      return;
    }

    // 追加新冻结块
    const newBlock = generateCleanHtml(content.slice(prevSplitPoint, splitPoint));
    prevSplitPoint = splitPoint;
    frozenBlocks.value.push(newBlock);
  },
  { immediate: true },
);

// 活跃块 HTML
const activeHtml = computed(() => {
  if (!props.isRunning) return '';
  const splitPoint = Math.max(prevSplitPoint, 0);
  return generateCleanHtml(props.content.slice(splitPoint));
});
</script>

<template>
  <!-- 非流式：一次完整渲染 -->
  <div
    v-if="!props.isRunning"
    :class="className"
    v-html="fullHtml"
  />
  <!-- 流式：冻结块 + 活跃块 -->
  <div v-else :class="className">
    <div
      v-for="(html, i) in frozenBlocks"
      :key="i"
      v-memo="[i]"
      v-html="html"
    />
    <div v-html="activeHtml" />
  </div>
</template>
