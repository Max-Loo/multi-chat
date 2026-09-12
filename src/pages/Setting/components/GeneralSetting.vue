<script setup lang="ts">
/** 通用设置页（Vue 版 GeneralSetting）：语言、自动命名、模型供应商、聊天导出 */
import LanguageSetting from '@/pages/Setting/components/GeneralSetting/components/LanguageSetting.vue';
import AutoNamingSetting from '@/pages/Setting/components/GeneralSetting/components/AutoNamingSetting.vue';
import ModelProviderSetting from '@/pages/Setting/components/GeneralSetting/components/ModelProviderSetting.vue';
import ChatExportSetting from '@/pages/Setting/components/GeneralSetting/components/ChatExportSetting.vue';
import { useScrollContainer } from '@/composables/useScrollContainer';

const { scrollContainerRef, scrollbarClassname } = useScrollContainer();
</script>

<template>
  <div
    :ref="(el) => { scrollContainerRef = el as HTMLElement | null }"
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
