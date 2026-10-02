<script setup lang="ts">
/**
 * 表格行（对应旧版 table.tsx 的 TableRow）
 * data-state="selected" 时高亮（通过 attrs 透传）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() =>
  cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', props.class),
);
</script>

<template>
  <tr :class="classes">
    <slot />
  </tr>
</template>
