<script setup lang="ts">
/**
 * 侧滑面板描述（对应旧版 sheet.tsx 的 SheetDescription）
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

const classes = computed(() => cn('text-muted-foreground text-sm', props.class));
</script>

<template>
  <RekaDialogDescription v-bind="delegatedProps" :class="classes">
    <slot />
  </RekaDialogDescription>
</template>
