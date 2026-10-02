<script setup lang="ts">
/**
 * 语言设置组件（对应旧版 LanguageSetting.tsx）
 */
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppConfigStore } from '@/stores';
import { useTranslation } from '@/composables/useTranslation';
import { changeAppLanguage } from '@/services/i18n';
import { toastQueue } from '@/services/toast';
import { LANGUAGE_CONFIGS } from '@/utils/constants';

// 语言选项配置（从 LANGUAGE_CONFIGS 派生）
const LANGUAGE_OPTIONS = LANGUAGE_CONFIGS.map((c) => ({
  value: c.code,
  label: `${c.flag} ${c.label}`,
}));

withDefaults(defineProps<{ className?: string }>(), { className: '' });

const appConfigStore = useAppConfigStore();
const { t } = useTranslation();
const { language } = storeToRefs(appConfigStore);

// 切换中状态（防抖避免重复触发）
const isChanging = ref(false);

/** 切换语言 */
const onLangChange = async (lang: string): Promise<void> => {
  if (lang === language.value || isChanging.value) return;

  isChanging.value = true;

  try {
    const { success } = await changeAppLanguage(lang);

    if (success) {
      // 切换成功，更新 store（插件会自动持久化到 localStorage）
      appConfigStore.setAppLanguage(lang);
    } else {
      void toastQueue.error(t('setting.languageSwitchFailed'));
    }
  } catch (error) {
    console.error('Failed to change language:', error);
    void toastQueue.error(t('setting.languageSwitchFailed'));
  } finally {
    setTimeout(() => (isChanging.value = false), 500);
  }
};
</script>

<template>
  <div
    data-testid="language-setting"
    :class="`flex w-full items-center justify-between text-base ${className}`"
  >
    <div>{{ t('common.language') }}</div>
    <Select
      :model-value="language"
      :disabled="isChanging"
      @update:model-value="(v: unknown) => onLangChange(String(v))"
    >
      <SelectTrigger class="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="option in LANGUAGE_OPTIONS" :key="option.value" :value="option.value">
          <div>{{ option.label }}</div>
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
