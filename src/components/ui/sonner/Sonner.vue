<script setup lang="ts">
/**
 * Toast 渲染组件（对应旧版 sonner.tsx 的 Toaster）
 * 基于 vue-sonner，主题取自自研 useTheme（替代 next-themes）
 */
import { computed } from 'vue';
import { Toaster as VueSonnerToaster, type ToasterProps } from 'vue-sonner';
import { useTheme } from '@/composables/useTheme';
import { cn } from '@/utils/utils';

const props = defineProps<ToasterProps & { class?: HTMLAttributes['class'] }>();

const { theme } = useTheme();

// 主题透传：system 保持原值交由 vue-sonner 处理
const toasterProps = computed(() => {
  const { class: _, ...delegated } = props;
  return {
    ...delegated,
    theme: (props.theme ?? theme.value) as ToasterProps['theme'],
  };
});

const classes = computed(() => cn('toaster group', props.class));
</script>

<template>
  <VueSonnerToaster
    v-bind="toasterProps"
    position="bottom-right"
    :swipe-directions="['right']"
    :offset="{ bottom: 24, right: 24 }"
    :class="classes"
    :toast-options="{
      classes: {
        toast:
          'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton:
          'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton:
          'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      },
    }"
  />
</template>
