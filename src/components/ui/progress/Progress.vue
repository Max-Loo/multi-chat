<script setup lang="ts">
/**
 * 进度条组件（对应旧版 progress.tsx）
 * 显示线性进度指示器，支持平滑过渡动画
 */
import { computed } from 'vue';
import {
  ProgressRoot,
  ProgressIndicator,
  type ProgressRootProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = withDefaults(
  defineProps<
    ProgressRootProps & { class?: HTMLAttributes['class'] }
  >(),
  { modelValue: 0 },
);

const classes = computed(() =>
  cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', props.class),
);

/** 指示条位移：value 越大越靠右 */
const indicatorStyle = computed(() => ({
  transform: `translateX(-${100 - (props.modelValue ?? 0)}%)`,
}));
</script>

<template>
  <ProgressRoot v-bind="props" :class="classes">
    <ProgressIndicator
      class="h-full w-full flex-1 bg-primary transition-all"
      :style="indicatorStyle"
    />
  </ProgressRoot>
</template>
