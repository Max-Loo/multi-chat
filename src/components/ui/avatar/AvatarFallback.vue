<script setup lang="ts">
/**
 * 头像回退组件（对应旧版 avatar.tsx 的 AvatarFallback）
 * 图片加载失败或未提供时显示
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  AvatarFallback as RekaAvatarFallback,
  type AvatarFallbackProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  AvatarFallbackProps & { class?: HTMLAttributes['class'] }
>();

const classes = computed(() =>
  cn('flex h-full w-full items-center justify-center rounded-full bg-muted', props.class),
);
</script>

<template>
  <RekaAvatarFallback v-bind="props" :class="classes">
    <slot />
  </RekaAvatarFallback>
</template>
