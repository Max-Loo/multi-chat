<script setup lang="ts">
/**
 * 确认对话框描述（对应旧版 alert-dialog.tsx 的 AlertDialogDescription）
 */
import { computed } from 'vue';
import {
  AlertDialogDescription as RekaAlertDialogDescription,
  type AlertDialogDescriptionProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  AlertDialogDescriptionProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const classes = computed(() => cn('text-sm text-muted-foreground', props.class));
</script>

<template>
  <RekaAlertDialogDescription v-bind="delegatedProps" :class="classes">
    <slot />
  </RekaAlertDialogDescription>
</template>
