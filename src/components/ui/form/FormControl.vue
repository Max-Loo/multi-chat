<script setup lang="ts">
/**
 * 表单控件包装器（对应旧版 form.tsx 的 FormControl）
 * 以子元素为渲染根，自动设置 aria 属性用于无障碍访问
 */
import { computed } from 'vue';
import { Primitive } from 'reka-ui';
import { useFormField } from './useFormField';

defineProps<{ asChild?: boolean }>();

const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

/** 注入到控件的 aria 属性 */
const ariaAttributes = computed(() => ({
  id: formItemId,
  'aria-describedby': !error
    ? `${formDescriptionId}`
    : `${formDescriptionId} ${formMessageId}`,
  'aria-invalid': !!error,
}));
</script>

<template>
  <Primitive :as-child="asChild ?? true" v-bind="ariaAttributes">
    <slot />
  </Primitive>
</template>
