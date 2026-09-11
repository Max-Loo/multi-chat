<script setup lang="ts">
/** 确认对话框取消按钮 */
import { AlertDialogCancel } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <AlertDialogCancel :class="cn('mt-2 sm:mt-0', props.class)">
    <slot />
  </AlertDialogCancel>
</template>
