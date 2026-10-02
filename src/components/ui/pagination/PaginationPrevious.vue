<script setup lang="ts">
/**
 * 上一页按钮（对应旧版 pagination.tsx 的 PaginationPrevious）
 * 仅保留图标，size 改为 icon + size-7 匹配现有按钮
 */
import { computed, type HTMLAttributes } from 'vue';
import { ChevronLeft } from 'lucide-vue-next';
import { cn } from '@/utils/utils';
import PaginationLink from './PaginationLink.vue';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('size-7', props.class));
</script>

<template>
  <PaginationLink aria-label="Go to previous page" size="icon" :class="classes">
    <ChevronLeft class="size-3.5" />
  </PaginationLink>
</template>
