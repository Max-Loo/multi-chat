<script setup lang="ts">
/** 头像回退显示（图片加载失败或无图时） */
import { AvatarFallback } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <AvatarFallback
    :class="cn('flex h-full w-full items-center justify-center rounded-full bg-muted', props.class)"
  >
    <slot />
  </AvatarFallback>
</template>
