<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/utils";

/**
 * 列表骨架屏组件属性
 */
interface SkeletonListProps {
  /** 列表项数量 */
  count?: number;
  /** 每项的高度 */
  itemHeight?: string;
  /** 项之间的间距 */
  gap?: string;
  /** 自定义类名 */
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<SkeletonListProps>(), {
  count: 5,
  itemHeight: "h-12",
  gap: "gap-3",
});
</script>

<template>
  <div
    :class="cn('flex flex-col', props.gap, props.class)"
    aria-hidden="true"
  >
    <Skeleton
      v-for="index in props.count"
      :key="index"
      variant="text"
      :class="props.itemHeight"
    />
  </div>
</template>
