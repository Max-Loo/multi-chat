<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTranslation } from 'i18next-vue';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/composables/useResponsive';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';

/**
 * 设置按钮
 */
interface SettingButton {
  name: string;
  path: string;
}

/**
 * 设置页面侧边栏
 * 支持按钮压缩：根据屏幕尺寸调整按钮高度和文字大小
 */
const route = useRoute();
const router = useRouter();
const { t } = useTranslation();
const { isDesktop } = useResponsive();
const { onScrollEvent, scrollbarClassname } = useAdaptiveScrollbar();

// 用来标识当前选中的哪个按钮（取路径第二段）
const selectedBtnPath = computed(() => route.path.split('/')[2]);

/** 需要渲染的按钮列表 */
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

/**
 * 点击某一类设置按钮的回调
 * @param btn 目标按钮
 */
function onClickSettingBtn(btn: SettingButton): void {
  if (selectedBtnPath.value === btn.path) return;

  router.push(btn.path);
}
</script>

<!--
  设置页面侧边栏
-->
<template>
  <nav
    :class="[
      'p-2 overflow-y-auto w-full h-full flex flex-col justify-start items-center',
      scrollbarClassname,
    ]"
    :aria-label="t('common.a11y.settingsNav')"
    @scroll="onScrollEvent"
  >
    <Button
      v-for="item in settingList"
      :key="item.path"
      variant="default"
      size="lg"
      :class="['w-full mb-2', !isDesktop ? 'h-9 text-sm' : 'h-11 text-base']"
      :aria-current="selectedBtnPath === item.path ? 'page' : undefined"
      @click="onClickSettingBtn(item)"
    >
      {{ item.name }}
    </Button>
  </nav>
</template>
