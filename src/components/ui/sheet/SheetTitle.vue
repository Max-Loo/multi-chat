<script setup lang="ts">
/**
 * 侧滑面板标题（对应旧版 sheet.tsx 的 SheetTitle）
 */
import { computed } from 'vue';
import {
  DialogTitle as RekaDialogTitle,
  type DialogTitleProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  DialogTitleProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const classes = computed(() => cn('text-foreground font-semibold', props.class));
</script>

<template>
  <RekaDialogTitle v-bind="delegatedProps" :class="classes">
    <slot />
  </RekaDialogTitle>
</template>
