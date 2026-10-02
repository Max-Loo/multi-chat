<script setup lang="ts">
/**
 * 对话框标题组件（对应旧版 dialog.tsx 的 DialogTitle）
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

const classes = computed(() =>
  cn('text-lg font-semibold leading-none tracking-tight', props.class),
);
</script>

<template>
  <RekaDialogTitle v-bind="delegatedProps" :class="classes">
    <slot />
  </RekaDialogTitle>
</template>
