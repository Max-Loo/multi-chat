<script setup lang="ts">
/**
 * 警告条组件（shadcn-vue 版）
 * 类名体系与 React 版 shadcn/ui Alert 保持一致
 */
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const props = defineProps<{ variant?: VariantProps<typeof alertVariants>['variant']; class?: string }>();
</script>

<template>
  <div :class="cn(alertVariants({ variant }), props.class)" role="alert">
    <slot />
  </div>
</template>
