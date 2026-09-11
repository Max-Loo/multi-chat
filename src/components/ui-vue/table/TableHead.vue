<script setup lang="ts">
/** 表头单元格 */
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <th
    :class="cn(
      'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
      props.class,
    )"
  >
    <slot />
  </th>
</template>
