<script setup lang="ts">
/**
 * 下拉菜单分隔线（对应旧版 dropdown-menu.tsx 的 DropdownMenuSeparator）
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  DropdownMenuSeparator as RekaDropdownMenuSeparator,
  type DropdownMenuSeparatorProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  DropdownMenuSeparatorProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const classes = computed(() => cn('-mx-1 my-1 h-px bg-muted', props.class));
</script>

<template>
  <RekaDropdownMenuSeparator v-bind="delegatedProps" :class="classes" />
</template>
