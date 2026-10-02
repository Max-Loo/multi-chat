<script setup lang="ts">
/**
 * 表单错误消息（对应旧版 form.tsx 的 FormMessage）
 * 自动显示验证错误或自定义消息
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';
import { useFormField } from './useFormField';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const { error, formMessageId } = useFormField();

/** 优先显示验证错误，否则显示插槽内容 */
const body = computed(() => error || null);

const classes = computed(() =>
  cn('text-[0.8rem] font-medium text-destructive', props.class),
);
</script>

<template>
  <p
    v-if="body || $slots.default"
    :id="formMessageId"
    data-testid="form-message-error"
    :class="classes"
  >
    <slot v-if="!body" />
    {{ body }}
  </p>
</template>
