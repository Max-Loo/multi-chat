<script setup lang="ts">
/** 对话框描述文本 */
import { DialogDescription } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <DialogDescription :class="cn('text-sm text-muted-foreground', props.class)">
    <slot />
  </DialogDescription>
</template>
