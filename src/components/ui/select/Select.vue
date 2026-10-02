<script setup lang="ts">
/**
 * 选择器根组件（对应旧版 select.tsx 的 Select）
 * 支持 open 与 modelValue 的 v-model 语义
 */
import {
  SelectRoot,
  useForwardPropsEmits,
  type SelectRootProps,
  type SelectRootEmits,
} from 'reka-ui';

const props = defineProps<SelectRootProps>();
const emits = defineEmits<SelectRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <SelectRoot v-bind="forwarded">
    <slot />
  </SelectRoot>
</template>
