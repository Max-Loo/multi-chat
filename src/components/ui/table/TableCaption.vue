<script setup lang="ts">
/**
 * 表格标题（对应旧版 table.tsx 的 TableCaption）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('mt-4 text-sm text-muted-foreground', props.class));
</script>

<template>
  <caption :class="classes">
    <slot />
  </caption>
</template>
