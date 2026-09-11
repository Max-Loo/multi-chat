<script setup lang="ts">
/** 表头行组 */
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <thead :class="cn('[&_tr]:border-b', props.class)">
    <slot />
  </thead>
</template>
