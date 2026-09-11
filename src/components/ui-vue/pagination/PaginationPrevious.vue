<script setup lang="ts">
/** 上一页按钮（仅图标，与 React 版一致） */
import { ChevronLeft } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<{ disabled?: boolean; class?: string }>();

const emit = defineEmits<{ (e: 'click', event: MouseEvent): void }>();
</script>

<template>
  <button
    aria-label="Go to previous page"
    :disabled="props.disabled"
    :class="cn('size-7 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50 cursor-pointer', props.class)"
    @click="emit('click', $event)"
  >
    <ChevronLeft class="size-3.5" />
  </button>
</template>
