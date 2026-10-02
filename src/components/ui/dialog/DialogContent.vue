<script setup lang="ts">
/**
 * 对话框内容组件（对应旧版 dialog.tsx 的 DialogContent）
 * 包含遮罩、传送门与右上角关闭按钮
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

const props = defineProps<
  DialogContentProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<DialogContentEmits>();

// 转发除 class 外的 props 与事件
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const classes = computed(() =>
  cn(
    'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
    props.class,
  ),
);

const closeClasses
  = 'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:cursor-pointer hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground';
</script>

<template>
  <DialogPortal>
    <DialogOverlay />
    <RekaDialogContent v-bind="forwarded" :class="classes">
      <slot />
      <DialogClose :class="closeClasses">
        <X :size="22" />
        <span class="sr-only">Close</span>
      </DialogClose>
    </RekaDialogContent>
  </DialogPortal>
</template>
