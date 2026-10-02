<script setup lang="ts">
/**
 * 分页链接按钮（对应旧版 pagination.tsx 的 PaginationLink）
 * 底层元素为 button，适配纯 Web 应用
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';
import { buttonVariants } from '@/components/ui/button/buttonVariants';

const props = withDefaults(
  defineProps<{
    isActive?: boolean;
    size?: 'default' | 'sm' | 'lg' | 'icon';
    class?: HTMLAttributes['class'];
  }>(),
  { isActive: false, size: 'icon' },
);

const classes = computed(() =>
  cn(
    buttonVariants({ variant: props.isActive ? 'outline' : 'ghost', size: props.size }),
    props.class,
  ),
);
</script>

<template>
  <button type="button" :aria-current="isActive ? 'page' : undefined" :class="classes">
    <slot />
  </button>
</template>
