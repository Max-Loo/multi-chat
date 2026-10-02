<script setup lang="ts">
/**
 * 侧滑面板内容（对应旧版 sheet.tsx 的 SheetContent）
 * 支持 top/right/bottom/left 四个方向滑入
 */
import { computed } from 'vue';
import {
  DialogPortal,
  DialogOverlay,
  DialogContent as RekaDialogContent,
  DialogClose,
  useForwardPropsEmits,
  type DialogContentProps,
  type DialogContentEmits,
} from 'reka-ui';
import { X } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

/** 侧滑方向 */
type SheetSide = 'top' | 'right' | 'bottom' | 'left';

const props = withDefaults(
  defineProps<
    DialogContentProps & {
      class?: HTMLAttributes['class'];
      side?: SheetSide;
      showCloseButton?: boolean;
    }
  >(),
  { side: 'right', showCloseButton: true },
);
const emits = defineEmits<DialogContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, side: __, showCloseButton: ___, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

/** 各方向对应的定位与动画类（与旧版一致） */
const sideClasses: Record<SheetSide, string> = {
  right:
    'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
  left: 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
  top: 'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b',
  bottom:
    'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t',
};

const classes = computed(() =>
  cn(
    'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
    sideClasses[props.side],
    props.class,
  ),
);

const closeClasses
  = 'ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 cursor-pointer transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none';
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50"
    />
    <RekaDialogContent v-bind="forwarded" :class="classes">
      <slot />
      <DialogClose v-if="showCloseButton" :class="closeClasses">
        <X class="size-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
    </RekaDialogContent>
  </DialogPortal>
</template>
