<script setup lang="ts">
/** 选择器内容容器（类名与 React 版 SelectContent 保持一致） */
import { SelectPortal, SelectContent } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string; position?: 'item-aligned' | 'popper' }>();
</script>

<template>
  <SelectPortal>
    <SelectContent
      :position="props.position ?? 'popper'"
      :class="cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        props.class,
      )"
    >
      <slot />
    </SelectContent>
  </SelectPortal>
</template>
