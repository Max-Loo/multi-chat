<script setup lang="ts">
/**
 * 表单标签（对应旧版 form.tsx 的 FormLabel）
 * 根据错误状态自动应用红色样式
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';
import { Label } from '@/components/ui/label';
import { useFormField } from './useFormField';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const { error, formItemId } = useFormField();

const classes = computed(() => cn(error && 'text-destructive', props.class));
</script>

<template>
  <Label :for="formItemId" :class="classes">
    <slot />
  </Label>
</template>
