<script setup lang="ts">
/**
 * 表单根组件（对应旧版 form.tsx 的 Form）
 * 向下提供 TanStack Form 实例上下文
 */
import { provide, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';
import { FORM_KEY, type FormContextValue } from './useFormField';

const props = defineProps<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  class?: HTMLAttributes['class'];
}>();

// provide 表单上下文
provide<FormContextValue>(FORM_KEY, { form: props.form });

// 兼容旧版：同时暴露 form 到 attrs 供直接绑定原生 form 元素
const classes = [cn('', props.class)];
</script>

<template>
  <form :class="classes">
    <slot />
  </form>
</template>
