<script setup lang="ts">
/** 下拉菜单标签 */
import { DropdownMenuLabel } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <DropdownMenuLabel :class="cn('px-2 py-1.5 text-sm font-semibold', props.class)">
    <slot />
  </DropdownMenuLabel>
</template>
