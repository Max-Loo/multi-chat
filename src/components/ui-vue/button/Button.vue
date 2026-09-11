<script setup lang="ts">
/**
 * 按钮组件（shadcn-vue / reka-ui 版）
 * 类名体系与 React 版 shadcn/ui Button 保持一致
 */
import { Primitive } from 'reka-ui';
import { cn } from '@/utils/utils';
import { buttonVariants, type ButtonVariants } from '.';

interface Props {
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  asChild?: boolean;
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <Primitive
    as="button"
    :as-child="props.asChild"
    :class="cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
