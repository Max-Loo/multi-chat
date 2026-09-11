<script setup lang="ts">
/** 单选项（类名与 React 版 RadioGroupItem 保持一致） */
import { RadioGroupItem, RadioGroupIndicator } from 'reka-ui';
import { Circle } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string; value: string; disabled?: boolean }>();
</script>

<template>
  <RadioGroupItem
    :value="props.value"
    :disabled="props.disabled"
    :class="cn(
      'aspect-square h-4 w-4 shrink-0 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
  >
    <RadioGroupIndicator class="flex items-center justify-center">
      <Circle class="h-2 w-2 fill-primary" />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
