<script setup lang="ts">
/**
 * 可调面板拖拽手柄（对应旧版 resizable.tsx 的 ResizableHandle）
 * 可选显示拖拽把手图标
 */
import { computed } from 'vue';
import {
  SplitterResizeHandle,
  useForwardPropsEmits,
  type SplitterResizeHandleProps,
  type SplitterResizeHandleEmits,
} from 'reka-ui';
import { GripVertical } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = withDefaults(
  defineProps<
    SplitterResizeHandleProps & {
      class?: HTMLAttributes['class'];
      withHandle?: boolean;
    }
  >(),
  { withHandle: false },
);
const emits = defineEmits<SplitterResizeHandleEmits>();

const delegatedProps = computed(() => {
  const { class: _, withHandle: __, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const classes = computed(() =>
  cn(
    'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-1 data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:-translate-y-1/2 data-[orientation=vertical]:after:translate-x-0 [&[data-orientation=vertical]>div]:rotate-90',
    props.class,
  ),
);
</script>

<template>
  <SplitterResizeHandle v-bind="forwarded" :class="classes">
    <template v-if="withHandle">
      <div class="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical class="h-2.5 w-2.5" />
      </div>
    </template>
    <slot v-else />
  </SplitterResizeHandle>
</template>
