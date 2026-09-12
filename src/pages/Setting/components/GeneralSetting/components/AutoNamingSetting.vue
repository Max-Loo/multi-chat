<script setup lang="ts">
/**
 * 自动命名开关设置组件（Vue 版 AutoNamingSetting）
 * 允许用户切换自动命名功能的开启/关闭状态
 */
import { Switch } from '@/components/ui-vue/switch';
import { useTranslation } from '@/composables/useTranslation';
import { useAppConfigStore } from '@/store/pinia/appConfig';

const appConfigStore = useAppConfigStore();
const { t } = useTranslation();

/**
 * 切换自动命名开关状态
 * @param checked 新的开关状态
 */
const handleToggle = (checked: boolean) => {
  appConfigStore.setAutoNamingEnabled(checked);
};
</script>

<template>
  <div class="flex w-full items-center justify-between">
    <!-- 左侧：标题和说明 -->
    <div class="flex flex-col gap-1">
      <div class="text-base">{{ t(($) => $.setting.autoNaming.title) }}</div>
      <div class="text-sm text-gray-500">
        {{ t(($) => $.setting.autoNaming.description) }}
      </div>
    </div>

    <!-- 右侧：开关控件 -->
    <Switch
      :model-value="appConfigStore.autoNamingEnabled"
      @update:model-value="handleToggle(Boolean($event))"
    />
  </div>
</template>
