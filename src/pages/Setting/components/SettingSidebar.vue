<script setup lang="ts">
/**
 * 设置页面侧边栏（对应旧版 SettingSidebar.tsx）
 * 支持按钮压缩：根据屏幕尺寸调整按钮高度和文字大小
 */
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';

/** 设置按钮 */
interface SettingButton {
  name: string;
  path: string;
}

const route = useRoute();
const router = useRouter();
const { isDesktop } = useResponsive();
const { t } = useTranslation();
const { onScrollEvent, scrollbarClassname } = useAdaptiveScrollbar();

// 用来标识当前选中的哪个按钮
const selectedBtnPath = computed<string | null>(() => {
  const key = route.path.split('/')[2];
  return key ?? null;
});

// 需要渲染的按钮列表
const settingList = computed<SettingButton[]>(() => {
  const list: SettingButton[] = [
    { name: t('setting.generalSetting'), path: 'common' },
    { name: t('setting.keyManagement.title'), path: 'key-management' },
  ];

  // 仅开发环境显示 Toast 测试按钮
  if (import.meta.env.DEV) {
    list.push({ name: t('setting.toastTest'), path: 'toast-test' });
  }

  return list;
});

/** 点击某一类设置按钮的回调 */
const onClickSettingBtn = (btn: SettingButton): void => {
  const { path } = btn;

  if (selectedBtnPath.value === path) return;

  void router.push(path);
};

// 按钮样式根据屏幕尺寸压缩
const buttonClassName = computed(
  () => `mb-2 w-full ${!isDesktop.value ? 'h-9 text-sm' : 'h-11 text-base'}`,
);
</script>

<template>
  <nav
    :aria-label="t('common.a11y.settingsNav')"
    :class="`flex h-full w-full flex-col items-center justify-start overflow-y-auto p-2 ${scrollbarClassname}`"
    @scroll="onScrollEvent"
  >
    <Button
      v-for="item in settingList"
      :key="item.path"
      variant="default"
      size="lg"
      :class="buttonClassName"
      :aria-current="selectedBtnPath === item.path ? 'page' : undefined"
      @click="onClickSettingBtn(item)"
    >
      {{ item.name }}
    </Button>
  </nav>
</template>
