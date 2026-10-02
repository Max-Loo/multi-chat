<script setup lang="ts">
/**
 * 表尾区（对应旧版 table.tsx 的 TableFooter）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() =>
  cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', props.class),
);
</script>

<template>
  <tfoot :class="classes">
    <slot />
  </tfoot>
</template>
