<script setup lang="ts">
/**
 * 下拉菜单内容容器（shadcn-vue 版，基于 reka-ui DropdownMenu）
 * 类名体系与 React 版 shadcn/ui DropdownMenuContent 保持一致
 */
import { DropdownMenuPortal, DropdownMenuContent } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string; sideOffset?: number }>();
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      :side-offset="props.sideOffset ?? 4"
      :class="cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        props.class,
      )"
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
