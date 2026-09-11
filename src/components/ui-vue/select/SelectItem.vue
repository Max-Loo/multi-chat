<script setup lang="ts">
/** 选择器选项（类名与 React 版 SelectItem 保持一致） */
import { SelectItem, SelectItemText, SelectItemIndicator } from 'reka-ui';
import { Check } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string; value: string; disabled?: boolean }>();
</script>

<template>
  <SelectItem
    :value="props.value"
    :disabled="props.disabled"
    :class="cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      props.class,
    )"
  >
    <span class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check class="h-4 w-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
