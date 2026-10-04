<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { Switch } from '@/components/ui/switch';
import { useAppConfigStore } from '@/store/appConfig';

/**
 * 自动命名开关设置组件
 */
const appConfigStore = useAppConfigStore();
const { t } = useTranslation();

const autoNamingEnabled = computed(() => appConfigStore.autoNamingEnabled);

/**
 * 切换自动命名开关状态
 * @param checked 新的开关状态
 */
function handleToggle(checked: boolean): void {
  appConfigStore.setAutoNamingEnabled(checked);
}
</script>

<template>
  <div class="flex items-center justify-between w-full">
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
      :aria-label="t('setting.autoNaming.title')"
      @update:model-value="handleToggle"
    />
  </div>
</template>
