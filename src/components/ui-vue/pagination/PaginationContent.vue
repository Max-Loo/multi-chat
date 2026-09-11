<script setup lang="ts">
/** 分页内容行 */
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <ul :class="cn('flex flex-row items-center gap-1', props.class)">
    <slot />
  </ul>
</template>
