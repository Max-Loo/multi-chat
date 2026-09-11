<script setup lang="ts">
/**
 * 工具提示（shadcn-vue 版，基于 reka-ui Tooltip）
 * 类名体系与 React 版 shadcn/ui TooltipContent 保持一致
 */
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipPortal, TooltipContent } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string; sideOffset?: number; content: string; delayDuration?: number }>();
</script>

<template>
  <TooltipProvider :delay-duration="props.delayDuration ?? 300">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side-offset="props.sideOffset ?? 4"
          :class="cn(
            'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            props.class,
          )"
        >
          {{ props.content }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
