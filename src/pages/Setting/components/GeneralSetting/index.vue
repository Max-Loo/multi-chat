<script setup lang="ts">
/**
 * 通用设置页（对应旧版 GeneralSetting/index.tsx）
 */
import { useScrollContainer } from '@/composables/useScrollContainer';
import LanguageSetting from './components/LanguageSetting.vue';
import ModelProviderSetting from './components/ModelProviderSetting/ModelProviderSetting.vue';
import AutoNamingSetting from './components/AutoNamingSetting.vue';
import ChatExportSetting from './components/ChatExportSetting.vue';

const { scrollContainerRef, scrollbarClassname } = useScrollContainer();

// 字符串 ref 绑定（模板 ref="..."），显式引用避免 TS6133
void scrollContainerRef;
</script>

<template>
  <div
    ref="scrollContainerRef"
    data-testid="scroll-container"
    :class="`flex h-full w-full flex-col items-center justify-start overflow-y-auto bg-gray-100 px-4 ${scrollbarClassname}`"
  >
    <div class="my-4 flex w-full flex-col items-center justify-start rounded-xl bg-white p-3">
      <LanguageSetting />
    </div>

    <div class="my-4 flex w-full flex-col items-center justify-start rounded-xl bg-white p-3">
      <AutoNamingSetting />
    </div>

    <div class="my-4 flex w-full flex-col items-center justify-start rounded-xl bg-white p-3">
      <ModelProviderSetting />
    </div>

    <div class="my-4 flex w-full flex-col items-center justify-start rounded-xl bg-white p-3">
      <ChatExportSetting />
    </div>
  </div>
</template>
