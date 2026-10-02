<script setup lang="ts">
/**
 * 表单项容器（对应旧版 form.tsx 的 FormItem）
 * 提供唯一 ID 并注入字段状态上下文
 */
import { computed, useId, provide, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';
import { FORM_ITEM_KEY, type FormItemContextValue } from './useFormField';

const props = defineProps<{
  /** 可选的字段实例（直接使用 form.Field 插槽时传递） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field?: any;
  class?: HTMLAttributes['class'];
}>();

// Vue 3.5 内置 useId
const id = useId();

// 注入表单项上下文（同步 setup 中完成）
provide<FormItemContextValue>(FORM_ITEM_KEY, {
  id,
  fieldState: computed(() => props.field).value,
});

const classes = computed(() => cn('space-y-2', props.class));
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
