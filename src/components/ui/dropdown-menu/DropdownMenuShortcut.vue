<script setup lang="ts">
/**
 * 下拉菜单快捷键提示（对应旧版 dropdown-menu.tsx 的 DropdownMenuShortcut）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('ml-auto text-xs tracking-widest opacity-60', props.class));
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
