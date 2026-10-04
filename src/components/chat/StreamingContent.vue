<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { generateCleanHtml } from '@/utils/markdown';
import { findSafeSplitPoint } from '@/utils/markdownSplit';

/**
 * 流式内容渲染组件的属性接口
 */
interface StreamingContentProps {
  /** markdown 内容 */
  content: string;
  /** 是否正在流式生成中 */
  isRunning?: boolean;
  /** 外层容器的 className */
  class?: string;
}

const props = withDefaults(defineProps<StreamingContentProps>(), {
  isRunning: false,
});

/**
 * 流式内容增量渲染组件
 *
 * 流式期间将内容按段落边界分割为冻结块和活跃块：
 * - 冻结块的 HTML 缓存在 append-only 数组中，通过 v-memo 跳过重复渲染
 * - 活跃块每次内容更新时重新渲染（内容短，开销小）
 * - 流式结束后执行一次完整渲染确保视觉正确性
 *
 * 重置机制：
 * - 父组件通过 key 变化触发组件重新挂载，自动清空缓存
 * - 内容缩短时（编辑回退/重新生成）自动重置冻结块缓存
 */

/** 已冻结的 HTML 块缓存（append-only） */
const frozenBlocks = ref<string[]>([]);
/** 活跃块起点（冻结内容之后的部分） */
const activeStart = ref(0);
/** 上一次切分点 */
let prevSplitPoint = 0;

// 非流式：一次性完整渲染
const fullHtml = computed(() => {
  if (props.isRunning) return '';
  return generateCleanHtml(props.content);
});

// 活跃块 HTML
const activeHtml = computed(() =>
  generateCleanHtml(props.content.slice(activeStart.value)),
);

// 流式期间按段落边界推进切分点，产出新的冻结块
watch(
  () => [props.content, props.isRunning] as const,
  ([content, isRunning]) => {
    if (!isRunning) {
      // 非流式状态由 fullHtml 完整渲染，重置缓存
      prevSplitPoint = 0;
      activeStart.value = 0;
      frozenBlocks.value = [];
      return;
    }

    const splitPoint = findSafeSplitPoint(content);

    // 内容缩短（编辑回退/重新生成）：重置全部冻结块
    if (splitPoint < prevSplitPoint) {
      prevSplitPoint = 0;
      activeStart.value = 0;
      frozenBlocks.value = [];
      return;
    }

    // 切分点未推进：无新块
    if (splitPoint === prevSplitPoint) {
      return;
    }

    frozenBlocks.value.push(generateCleanHtml(content.slice(prevSplitPoint, splitPoint)));
    prevSplitPoint = splitPoint;
    activeStart.value = splitPoint;
  },
  { immediate: true },
);
</script>

<template>
  <!-- 非流式：完整渲染 -->
  <div v-if="!props.isRunning" :class="props.class" v-html="fullHtml" />

  <!-- 流式：冻结块 + 活跃块 -->
  <div v-else :class="props.class">
    <div
      v-for="(html, i) in frozenBlocks"
      :key="i"
      v-memo="[html]"
      v-html="html"
    />
    <div v-html="activeHtml" />
  </div>
</template>
