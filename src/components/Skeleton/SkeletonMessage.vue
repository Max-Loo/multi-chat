<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { computed } from "vue";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/utils";

/**
 * 聊天消息骨架屏组件属性
 */
interface SkeletonMessageProps {
  /** 是否为当前用户发送的消息（决定布局方向） */
  isSelf?: boolean;
  /** 消息行数 */
  lines?: number;
  /** 自定义类名 */
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<SkeletonMessageProps>(), {
  isSelf: false,
  lines: 3,
});

/** 消息文本行序号列表 */
const lineIndexes = computed(() => Array.from({ length: props.lines }, (_, i) => i));
</script>

<template>
  <div
    :class="
      cn(
        'flex gap-3 p-4',
        props.isSelf ? 'flex-row-reverse' : 'flex-row',
        props.class,
      )
    "
    aria-hidden="true"
  >
    <!-- 头像骨架 -->
    <Skeleton variant="circle" class="w-10 h-10 shrink-0" />

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
      <Skeleton variant="text" class="w-20 h-3" />

      <!-- 消息文本行 -->
      <div
        :class="
          cn(
            'flex flex-col gap-2',
            props.isSelf ? 'items-end' : 'items-start',
          )
        "
        style="width: 100%"
      >
        <Skeleton
          v-for="index in lineIndexes"
          :key="index"
          variant="text"
          :class="
            cn(
              'h-4',
              // 最后一行可能较短
              index === props.lines ? 'w-2/3' : 'w-full',
            )
          "
        />
      </div>
    </div>
  </div>
</template>
