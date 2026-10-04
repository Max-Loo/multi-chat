<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/utils';

/**
 * 聊天消息骨架屏组件属性
 */
interface SkeletonMessageProps {
  /** 是否为当前用户发送的消息（决定布局方向） */
  isSelf?: boolean;
  /** 消息行数 */
  lines?: number;
}

const props = withDefaults(defineProps<SkeletonMessageProps>(), {
  isSelf: false,
  lines: 3,
});
</script>

<!-- 聊天消息骨架屏：模拟聊天消息的结构（头像 + 多行文本） -->
<template>
  <div
    :class="
      cn(
        'flex gap-3 p-4',
        props.isSelf ? 'flex-row-reverse' : 'flex-row',
      )
    "
    aria-hidden="true"
  >
    <!-- 头像骨架 -->
    <Skeleton class="w-10 h-10 shrink-0 rounded-full" />

    <!-- 消息内容骨架 -->
    <div
      :class="
        cn(
          'flex flex-col gap-2 max-w-[70%]',
          props.isSelf ? 'items-end' : 'items-start',
        )
      "
    >
      <!-- 用户名 -->
      <Skeleton class="w-20 h-3" />

      <!-- 消息文本行 -->
      <div
        :class="
          cn(
            'flex flex-col gap-2 w-full',
            props.isSelf ? 'items-end' : 'items-start',
          )
        "
      >
        <Skeleton
          v-for="i in props.lines"
          :key="i"
          :class="
            cn(
              'h-4',
              // 最后一行可能较短
              i === props.lines ? 'w-2/3' : 'w-full',
            )
          "
        />
      </div>
    </div>
  </div>
</template>
