<script setup lang="ts">
/**
 * 对话框描述组件（对应旧版 dialog.tsx 的 DialogDescription）
 */
import { computed } from 'vue';
import {
  DialogDescription as RekaDialogDescription,
  type DialogDescriptionProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  DialogDescriptionProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const classes = computed(() => cn('text-sm text-muted-foreground', props.class));
</script>

<template>
  <RekaDialogDescription v-bind="delegatedProps" :class="classes">
    <slot />
  </RekaDialogDescription>
</template>
