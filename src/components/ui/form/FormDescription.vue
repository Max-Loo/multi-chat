<script setup lang="ts">
/**
 * 表单描述文本（对应旧版 form.tsx 的 FormDescription）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';
import { useFormField } from './useFormField';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const { formDescriptionId } = useFormField();

const classes = computed(() =>
  cn('text-[0.8rem] text-muted-foreground', props.class),
);
</script>

<template>
  <p :id="formDescriptionId" :class="classes">
    <slot />
  </p>
</template>
