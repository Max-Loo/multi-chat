<script setup lang="ts">
/** 确认对话框标题 */
import { AlertDialogTitle } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <AlertDialogTitle :class="cn('text-lg font-semibold', props.class)">
    <slot />
  </AlertDialogTitle>
</template>
