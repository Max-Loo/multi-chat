<script setup lang="ts">
/**
 * 确认对话框取消按钮（对应旧版 alert-dialog.tsx 的 AlertDialogCancel）
 * 样式对齐 Button outline 变体
 */
import { computed } from 'vue';
import {
  AlertDialogCancel as RekaAlertDialogCancel,
  type AlertDialogCancelProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';
import { buttonVariants } from '@/components/ui/button/buttonVariants';

const props = defineProps<
  AlertDialogCancelProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const classes = computed(() =>
  cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', props.class),
);
</script>

<template>
  <RekaAlertDialogCancel v-bind="delegatedProps" :class="classes">
    <slot />
  </RekaAlertDialogCancel>
</template>
