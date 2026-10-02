<script setup lang="ts">
/**
 * 自动命名开关设置组件（对应旧版 AutoNamingSetting.tsx）
 */
import { storeToRefs } from 'pinia';
import { Switch } from '@/components/ui/switch';
import { useAppConfigStore } from '@/stores';
import { useTranslation } from '@/composables/useTranslation';

const { t } = useTranslation();
const appConfigStore = useAppConfigStore();
const { autoNamingEnabled } = storeToRefs(appConfigStore);

/** 切换自动命名开关状态 */
const handleToggle = (checked: boolean): void => {
  appConfigStore.setAutoNamingEnabled(checked);
};
</script>

<template>
  <div class="flex w-full items-center justify-between">
    <!-- 左侧：标题和说明 -->
    <div class="flex flex-col gap-1">
      <div class="text-base">{{ t('setting.autoNaming.title') }}</div>
      <div class="text-sm text-gray-500">
        {{ t('setting.autoNaming.description') }}
      </div>
    </div>

    <!-- 右侧：开关控件 -->
    <Switch
      :model-value="autoNamingEnabled"
      @update:model-value="handleToggle"
    />
  </div>
</template>
