<script setup lang="ts">
/**
 * 设置页面侧边栏（Vue 版 SettingSidebar）
 * 支持按钮压缩：根据屏幕尺寸调整按钮高度和文字大小
 */
import { computed, type ComponentPublicInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/components/ui-vue/button';
import { useResponsive } from '@/composables/useResponsive';
import { useScrollContainer } from '@/composables/useScrollContainer';
import { useTranslation } from '@/composables/useTranslation';

interface SettingButton {
  /** 按钮文案 */
  name: string;
  /** 路由路径 */
  path: string;
}

const route = useRoute();
const router = useRouter();
const { isDesktop } = useResponsive();
const { t } = useTranslation();

const { scrollbarClassname, scrollContainerRef } = useScrollContainer();

// 滚动容器 ref 绑定（useScrollContainer 需要 HTMLElement 类型）
const setScrollContainer = (el: Element | ComponentPublicInstance | null) => {
  scrollContainerRef.value = el as HTMLElement | null;
};

// 用来标识当前选中的哪个按钮（取路径第二段）
const selectedBtnPath = computed<string | null | undefined>(() => route.path.split('/')[2]);

// 需要渲染的按钮列表
const settingList = computed<SettingButton[]>(() => {
  const list = [
    {
      name: t(($) => $.setting.generalSetting) as string,
      path: 'common',
    },
    {
      name: t(($) => $.setting.keyManagement.title) as string,
      path: 'key-management',
    },
  ];

  // 仅开发环境显示 Toast 测试按钮
  if (import.meta.env.DEV) {
    list.push({
      name: t(($) => $.setting.toastTest) as string,
      path: 'toast-test',
    });
  }

  return list;
});

// 按钮样式根据屏幕尺寸压缩（参考 ChatButton 的压缩逻辑）
const buttonClassName = computed(() => `w-full mb-2 ${!isDesktop.value ? 'h-9 text-sm' : 'h-11 text-base'}`);

/**
 * 点击某一类设置按钮的回调
 * @param btn 被点击的设置按钮
 */
const onClickSettingBtn = (btn: SettingButton) => {
  const { path } = btn;

  if (selectedBtnPath.value === path) return;

  void router.push(path);
};
</script>

<template>
  <nav
    :ref="setScrollContainer"
    :aria-label="t(($) => $.common.a11y.settingsNav) as string"
    :class="`flex h-full w-full flex-col items-center justify-start overflow-y-auto p-2 ${scrollbarClassname}`"
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
