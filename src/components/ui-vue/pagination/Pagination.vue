<script setup lang="ts">
/** 分页容器（Vue 版，类名与 React 版 pagination.tsx 一致） */
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <nav role="navigation" aria-label="pagination" :class="cn('mx-auto flex w-full justify-center', props.class)">
    <slot />
  </nav>
</template>
