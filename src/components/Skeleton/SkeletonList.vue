<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/utils';

/**
 * 列表骨架屏组件属性
 */
interface SkeletonListProps {
  /** 列表项数量 */
  count?: number;
  /** 每项的高度类名 */
  itemHeight?: string;
  /** 项之间的间距类名 */
  gap?: string;
}

const props = withDefaults(defineProps<SkeletonListProps>(), {
  count: 5,
  itemHeight: 'h-12',
  gap: 'gap-3',
});
</script>

<!-- 列表骨架屏组件：渲染指定数量的骨架列表项 -->
<template>
  <div :class="cn('flex flex-col', props.gap)" aria-hidden="true">
    <Skeleton
      v-for="i in props.count"
      :key="i"
      :class="props.itemHeight"
    />
  </div>
</template>
