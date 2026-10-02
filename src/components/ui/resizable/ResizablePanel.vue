<script setup lang="ts">
/**
 * 可调面板（对应旧版 resizable.tsx 的 ResizablePanel）
 */
import {
  SplitterPanel,
  useForwardPropsEmits,
  type SplitterPanelProps,
  type SplitterPanelEmits,
} from 'reka-ui';

const props = defineProps<SplitterPanelProps>();
const emits = defineEmits<SplitterPanelEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <SplitterPanel v-bind="forwarded">
    <slot />
  </SplitterPanel>
</template>
