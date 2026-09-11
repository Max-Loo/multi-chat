<script setup lang="ts">
/**
 * 加载指示器（Vue 版 Spinner）
 */
import { Loader2 } from 'lucide-vue-next';
import { cn } from '@/utils/utils';
import { useTranslation } from '@/composables/useTranslation';

const props = defineProps<{ class?: string }>();

const { t } = useTranslation();
</script>

<template>
  <Loader2
    role="status"
    :aria-label="t('common.loading') as string"
    :class="cn('size-4 animate-spin', props.class)"
  />
</template>
