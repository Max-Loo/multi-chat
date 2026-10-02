<script setup lang="ts">
/**
 * 选择器分组（对应旧版 select.tsx 的 SelectGroup）
 */
import { SelectGroup, useForwardProps, type SelectGroupProps } from 'reka-ui';

const props = defineProps<SelectGroupProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <SelectGroup v-bind="forwarded">
    <slot />
  </SelectGroup>
</template>
