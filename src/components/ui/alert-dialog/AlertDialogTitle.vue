<script setup lang="ts">
/**
 * 确认对话框标题（对应旧版 alert-dialog.tsx 的 AlertDialogTitle）
 */
import { computed } from 'vue';
import {
  AlertDialogTitle as RekaAlertDialogTitle,
  type AlertDialogTitleProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  AlertDialogTitleProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const classes = computed(() => cn('text-lg font-semibold', props.class));
</script>

<template>
  <RekaAlertDialogTitle v-bind="delegatedProps" :class="classes">
    <slot />
  </RekaAlertDialogTitle>
</template>
