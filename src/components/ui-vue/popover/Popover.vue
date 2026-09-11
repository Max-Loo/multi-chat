<script setup lang="ts">
/**
 * 气泡弹层（shadcn-vue 版，基于 reka-ui Popover）
 * 类名体系与 React 版 shadcn/ui PopoverContent 保持一致
 */
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string; sideOffset?: number }>();

const open = defineModel<boolean>('open');
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :side-offset="props.sideOffset ?? 4"
        :class="cn(
          'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          props.class,
        )"
      >
        <slot />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
