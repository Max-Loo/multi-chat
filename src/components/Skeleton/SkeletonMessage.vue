<script setup lang="ts">
/**
 * 聊天消息骨架屏组件（对应旧版 SkeletonMessage.tsx）
 * 模拟聊天消息的结构（头像 + 多行文本）
 */
import { computed } from 'vue';
import { cn } from '@/utils/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** 消息骨架屏 props */
const props = withDefaults(
  defineProps<{
    /** 是否为当前用户发送的消息（决定布局方向） */
    isSelf?: boolean;
    /** 消息行数 */
    lines?: number;
    /** 自定义类名 */
    class?: string;
  }>(),
  { isSelf: false, lines: 3 },
);

const rootClass = computed(() =>
  cn('flex gap-3 p-4', props.isSelf ? 'flex-row-reverse' : 'flex-row', props.class),
);

const contentClass = computed(() =>
  cn('flex max-w-[70%] flex-col gap-2', props.isSelf ? 'items-end' : 'items-start'),
);

const linesClass = computed(() =>
  cn('flex w-full flex-col gap-2', props.isSelf ? 'items-end' : 'items-start'),
);
</script>

<template>
  <div :class="rootClass" aria-hidden="true">
    <Skeleton variant="circle" class="h-10 w-10 shrink-0" />
    <div :class="contentClass">
      <Skeleton variant="text" class="h-3 w-20" />
      <div :class="linesClass" style="width: 100%">
        <Skeleton
          v-for="index in lines"
          :key="index"
          variant="text"
          :class="cn('h-4', index === lines - 1 ? 'w-2/3' : 'w-full')"
        />
      </div>
    </div>
  </div>
</template>
