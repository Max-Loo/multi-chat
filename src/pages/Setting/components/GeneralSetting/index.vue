<script setup lang="ts">
import LanguageSetting from './components/LanguageSetting.vue';
import ModelProviderSetting from './components/ModelProviderSetting/index.vue';
import AutoNamingSetting from './components/AutoNamingSetting.vue';
import ChatExportSetting from './components/ChatExportSetting.vue';
import { useScrollContainer } from '@/composables/useScrollContainer';

/**
 * 通用设置页
 */
const scroll = useScrollContainer();
</script>

<template>
  <div
    :ref="(el) => { scroll.scrollContainerRef.value = el as HTMLDivElement | null; }"
    data-testid="scroll-container"
    :class="[
      'flex flex-col items-center justify-start w-full h-full px-4 overflow-y-auto bg-gray-100',
      scroll.scrollbarClassname,
    ]"
    @scroll="scroll.onScrollEvent"
  >
    <div class="w-full p-3 my-4 bg-white rounded-xl flex flex-col justify-start items-center">
      <LanguageSetting />
    </div>

    <div class="w-full p-3 my-4 bg-white rounded-xl flex flex-col justify-start items-center">
      <AutoNamingSetting />
    </div>

    <div class="w-full p-3 my-4 bg-white rounded-xl flex flex-col justify-start items-center">
      <ModelProviderSetting />
    </div>

    <div class="w-full p-3 my-4 bg-white rounded-xl flex flex-col justify-start items-center">
      <ChatExportSetting />
    </div>
  </div>
</template>
