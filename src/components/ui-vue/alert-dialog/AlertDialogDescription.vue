<script setup lang="ts">
/** 确认对话框描述 */
import { AlertDialogDescription } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <AlertDialogDescription :class="cn('text-sm text-muted-foreground', props.class)">
    <slot />
  </AlertDialogDescription>
</template>
