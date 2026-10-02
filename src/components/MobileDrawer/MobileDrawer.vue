<script setup lang="ts">
/**
 * 通用移动端抽屉组件（对应旧版 MobileDrawer/index.tsx）
 * 从左侧滑出的抽屉容器，用于移动端显示侧边栏等组件
 */
import { useTranslation } from '@/composables/useTranslation';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

/** 移动端抽屉 props */
withDefaults(
  defineProps<{
    /** 抽屉是否打开 */
    open: boolean;
    /** 是否显示关闭按钮 */
    showCloseButton?: boolean;
  }>(),
  { showCloseButton: true },
);

/** 抽屉开关事件 */
const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const { t } = useTranslation();
</script>

<template>
  <Sheet
    :open="open"
    @update:open="(value: boolean) => emit('update:open', value)"
  >
    <SheetContent
      side="left"
      class="w-fit max-w-[85vw] sm:max-w-md min-w-60"
      :show-close-button="showCloseButton"
      :aria-description="t('navigation.mobileDrawer.ariaDescription')"
    >
      <SheetTitle class="sr-only">
        {{ t('navigation.mobileDrawer.title') }}
      </SheetTitle>
      <SheetDescription class="sr-only">
        {{ t('navigation.mobileDrawer.description') }}
      </SheetDescription>
      <slot />
    </SheetContent>
  </Sheet>
</template>
