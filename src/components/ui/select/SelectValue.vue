<script setup lang="ts">
/**
 * 选择器当前值显示（对应旧版 select.tsx 的 SelectValue）
 * placeholder 通过 props 传入
 */
import { SelectValue, useForwardProps, type SelectValueProps } from 'reka-ui';

const props = defineProps<SelectValueProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <SelectValue v-bind="forwarded" />
</template>
