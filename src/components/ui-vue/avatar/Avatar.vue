<script setup lang="ts">
/**
 * 头像组件（shadcn-vue 版，基于 reka-ui Avatar）
 * 类名体系与 React 版 shadcn/ui Avatar 保持一致
 */
import { AvatarRoot } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <AvatarRoot :class="cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', props.class)">
    <slot />
  </AvatarRoot>
</template>
