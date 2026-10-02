<script setup lang="ts">
/**
 * 确认对话框确认按钮（对应旧版 alert-dialog.tsx 的 AlertDialogAction）
 * 样式对齐 Button default 变体
 */
import { computed } from 'vue';
import {
  AlertDialogAction as RekaAlertDialogAction,
  type AlertDialogActionProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';
import { buttonVariants } from '@/components/ui/button/buttonVariants';

const props = defineProps<
  AlertDialogActionProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const classes = computed(() => cn(buttonVariants(), props.class));
</script>

<template>
  <RekaAlertDialogAction v-bind="delegatedProps" :class="classes">
    <slot />
  </RekaAlertDialogAction>
</template>
