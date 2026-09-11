<script setup lang="ts">
/**
 * 开关组件（shadcn-vue 版，基于 reka-ui Switch）
 * 类名体系与 React 版 shadcn/ui Switch 保持一致
 */
import { SwitchRoot, SwitchThumb } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string; disabled?: boolean }>();

const model = defineModel<boolean>();
</script>

<template>
  <SwitchRoot
    v-model="model"
    :disabled="props.disabled"
    :class="cn(
      'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      props.class,
    )"
  >
    <SwitchThumb
      :class="cn(
        'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
      )"
    />
  </SwitchRoot>
</template>
