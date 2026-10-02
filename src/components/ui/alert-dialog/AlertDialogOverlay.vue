<script setup lang="ts">
/**
 * 确认对话框遮罩（对应旧版 alert-dialog.tsx 的 AlertDialogOverlay）
 */
import { computed } from 'vue';
import {
  AlertDialogOverlay as RekaAlertDialogOverlay,
  type AlertDialogOverlayProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  AlertDialogOverlayProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const classes = computed(() =>
  cn(
    'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    props.class,
  ),
);
</script>

<template>
  <RekaAlertDialogOverlay v-bind="delegatedProps" :class="classes" />
</template>
