<script setup lang="ts">
/**
 * 侧边抽屉容器（Vue 版，基于 reka-ui DialogRoot + side 变体）
 * 类名体系与 React 版 shadcn/ui Sheet 保持一致
 */
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui';
import { X } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = withDefaults(
  defineProps<{
    open: boolean;
    side?: 'left' | 'right' | 'top' | 'bottom';
    class?: string;
    showCloseButton?: boolean;
  }>(),
  { side: 'right', showCloseButton: true },
);

const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>();

/** 各方向的滑入/滑出类名（与 React 版 sheet.tsx 一致） */
const sideClasses: Record<string, string> = {
  left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
  right:
    'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
  top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
  bottom:
    'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
};
</script>

<template>
  <DialogRoot :open="props.open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <DialogContent
        :class="cn(
          'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out',
          sideClasses[props.side],
          props.class,
        )"
      >
        <DialogTitle class="sr-only">
          <slot name="title" />
        </DialogTitle>
        <DialogDescription class="sr-only">
          <slot name="description" />
        </DialogDescription>
        <slot />
        <DialogClose
          v-if="props.showCloseButton"
          class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
