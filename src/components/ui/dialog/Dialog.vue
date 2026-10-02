<script setup lang="ts">
/**
 * 对话框根组件（对应旧版 dialog.tsx 的 Dialog）
 * 管理开关状态，透传 open 的 v-model 语义
 */
import { DialogRoot, useForwardPropsEmits, type DialogRootProps, type DialogRootEmits } from 'reka-ui';

const props = defineProps<DialogRootProps>();
const emits = defineEmits<DialogRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DialogRoot v-bind="forwarded">
    <slot />
  </DialogRoot>
</template>
