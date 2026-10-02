<script setup lang="ts">
/**
 * 表单字段组件（对应旧版 form.tsx 的 FormField）
 * 包装 TanStack vue-form 的 Field，通过作用域插槽向 FormItem 提供字段实例。
 *
 * 注意：Vue 的 provide 只能在 setup 同步调用，无法在插槽渲染时注入字段上下文，
 * 因此字段实例经由插槽参数传递给 FormItem 的 field prop（与旧版"直接在
 * form.Field 的 children 函数中使用"的方式对齐）。
 */
import { inject } from 'vue';
import { Field as VueFormField } from '@tanstack/vue-form';
import { FORM_KEY } from './useFormField';

const props = defineProps<{
  /** 字段名称 */
  name: string;
}>();

// 从 Form 根组件获取表单实例
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const form = inject(FORM_KEY)!.form;
</script>

<template>
  <VueFormField :form="form" :name="props.name" v-slot="field">
    <slot :field="field" />
  </VueFormField>
</template>
