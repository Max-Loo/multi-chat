<script setup lang="ts">
/**
 * 对话框遮罩组件（对应旧版 dialog.tsx 的 DialogOverlay）
 */
import { computed } from 'vue';
import {
  DialogOverlay as RekaDialogOverlay,
  type DialogOverlayProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  DialogOverlayProps & { class?: HTMLAttributes['class'] }
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
  <RekaDialogOverlay v-bind="delegatedProps" :class="classes">
    <slot />
  </RekaDialogOverlay>
</template>
