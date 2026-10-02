<script setup lang="ts">
/**
 * 列表骨架屏组件（对应旧版 SkeletonList.tsx）
 * 渲染指定数量的骨架列表项
 */
import { cn } from '@/utils/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** 列表骨架屏 props */
const props = withDefaults(
  defineProps<{
    /** 列表项数量 */
    count?: number;
    /** 每项的高度 */
    itemHeight?: string;
    /** 项之间的间距 */
    gap?: string;
    /** 自定义类名 */
    class?: string;
  }>(),
  { count: 5, itemHeight: 'h-12', gap: 'gap-3' },
);
</script>

<template>
  <div :class="cn('flex flex-col', gap, props.class)" aria-hidden="true">
    <Skeleton
      v-for="index in count"
      :key="index"
      variant="text"
      :class="itemHeight"
    />
  </div>
</template>
