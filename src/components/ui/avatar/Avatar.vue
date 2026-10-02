<script setup lang="ts">
/**
 * 头像容器组件（对应旧版 avatar.tsx 的 Avatar）
 */
import { computed, type HTMLAttributes } from 'vue';
import { AvatarRoot } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() =>
  cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', props.class),
);
</script>

<template>
  <AvatarRoot :class="classes">
    <slot />
  </AvatarRoot>
</template>
