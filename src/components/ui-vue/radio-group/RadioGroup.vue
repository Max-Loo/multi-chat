<script setup lang="ts">
/**
 * 单选组（shadcn-vue 版，基于 reka-ui RadioGroup）
 * 类名体系与 React 版 shadcn/ui RadioGroup 保持一致
 */
import { RadioGroupRoot } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string; disabled?: boolean }>();

const model = defineModel<string>();
</script>

<template>
  <RadioGroupRoot
    v-model="model"
    :disabled="props.disabled"
    :class="cn('grid gap-2', props.class)"
  >
    <slot />
  </RadioGroupRoot>
</template>
