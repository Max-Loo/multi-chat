<script setup lang="ts">
/**
 * 通用移动端抽屉组件（Vue 版 MobileDrawer）
 * 从左侧滑出的抽屉容器，用于移动端显示侧边栏等组件
 */
import { Sheet } from '@/components/ui-vue/sheet';
import { useTranslation } from '@/composables/useTranslation';

const props = withDefaults(
  defineProps<{
    /** 抽屉是否打开 */
    open: boolean;
    /** 是否显示关闭按钮 */
    showCloseButton?: boolean;
  }>(),
  { showCloseButton: true },
);

const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>();

const { t } = useTranslation();
</script>

<template>
  <Sheet
    :open="props.open"
    side="left"
    :show-close-button="props.showCloseButton"
    class="w-fit max-w-[85vw] sm:max-w-md min-w-60"
    @update:open="emit('update:open', $event)"
  >
    <template #title>{{ t(($) => $.navigation.mobileDrawer.title) }}</template>
    <template #description>{{ t(($) => $.navigation.mobileDrawer.ariaDescription) }}</template>
    <slot />
  </Sheet>
</template>
