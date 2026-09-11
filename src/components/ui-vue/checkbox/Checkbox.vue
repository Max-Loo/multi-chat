<script setup lang="ts">
/**
 * 复选框组件（shadcn-vue 版，基于 reka-ui Checkbox）
 * 类名体系与 React 版 shadcn/ui Checkbox 保持一致
 */
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui';
import { Check } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string; disabled?: boolean }>();

const model = defineModel<boolean | 'indeterminate'>();
</script>

<template>
  <CheckboxRoot
    v-model="model"
    :disabled="props.disabled"
    :class="cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      props.class,
    )"
  >
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <Check class="h-4 w-4" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
