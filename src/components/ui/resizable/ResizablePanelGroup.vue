<script setup lang="ts">
/**
 * 可调面板组（对应旧版 resizable.tsx 的 ResizablePanelGroup）
 * 底层使用 Reka UI Splitter（paneforge 语义），保持旧版 API 命名
 */
import { computed } from 'vue';
import {
  SplitterGroup,
  useForwardPropsEmits,
  type SplitterGroupProps,
  type SplitterGroupEmits,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  SplitterGroupProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<SplitterGroupEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const classes = computed(() =>
  cn(
    'flex h-full w-full data-[orientation=vertical]:flex-col',
    props.class,
  ),
);
</script>

<template>
  <SplitterGroup v-bind="forwarded" :class="classes">
    <slot />
  </SplitterGroup>
</template>
