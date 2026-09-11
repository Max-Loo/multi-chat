<script setup lang="ts">
/** 确认对话框确认按钮 */
import { AlertDialogAction } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();

const emit = defineEmits<{ (e: 'click', event: MouseEvent): void }>();
</script>

<template>
  <AlertDialogAction
    :class="cn(
      'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      props.class,
    )"
    @click="emit('click', $event)"
  >
    <slot />
  </AlertDialogAction>
</template>
