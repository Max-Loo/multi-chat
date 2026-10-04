<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

/**
 * 通用移动端抽屉组件属性
 */
interface MobileDrawerProps {
  /** 抽屉是否打开 */
  open: boolean;
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
}

const props = withDefaults(defineProps<MobileDrawerProps>(), {
  showCloseButton: true,
});

const emit = defineEmits<{
  /** 抽屉打开/关闭状态变化 */
  (e: 'update:open', open: boolean): void;
}>();

const { t } = useTranslation();
</script>

<!--
  通用移动端抽屉组件
  从左侧滑出的抽屉容器，用于移动端显示侧边栏等组件
-->
<template>
  <Sheet
    :open="props.open"
    @update:open="(value: boolean) => emit('update:open', value)"
  >
    <SheetContent
      :aria-description="t('navigation.mobileDrawer.ariaDescription')"
      side="left"
      class="w-fit max-w-[85vw] sm:max-w-md min-w-60"
      :show-close-button="props.showCloseButton"
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
