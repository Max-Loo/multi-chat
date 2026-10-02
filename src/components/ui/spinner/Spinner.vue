<script setup lang="ts">
/**
 * 加载指示器组件（对应旧版 spinner.tsx）
 * 使用响应式翻译提供 aria-label
 */
import { computed, type SVGAttributes } from 'vue';
import { Loader2Icon } from 'lucide-vue-next';
import { cn } from '@/utils/utils';
import { useTranslation } from '@/composables/useTranslation';

const props = defineProps<{ class?: SVGAttributes['class'] }>();

const { t } = useTranslation();

/** 合并加载图标样式类 */
const classes = computed(() => cn('size-4 animate-spin', props.class));
</script>

<template>
  <Loader2Icon role="status" :aria-label="t('common.loading')" :class="classes" />
</template>
