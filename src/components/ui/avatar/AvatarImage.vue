<script setup lang="ts">
/**
 * 头像图片组件（对应旧版 avatar.tsx 的 AvatarImage）
 */
import { computed, type ImgHTMLAttributes } from 'vue';
import { AvatarImage as RekaAvatarImage, type AvatarImageProps } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  AvatarImageProps & { class?: ImgHTMLAttributes['class'] }
>();

const classes = computed(() => cn('aspect-square h-full w-full', props.class));
</script>

<template>
  <RekaAvatarImage v-bind="props" :class="classes" />
</template>
