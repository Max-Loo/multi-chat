<script setup lang="ts">
/**
 * 语言设置组件（Vue 版 LanguageSetting）
 * 语言切换委托给 appConfig store 的 setAppLanguage（含 i18n 切换、持久化与 Toast，原 middleware 逻辑已下沉）
 */
import { ref } from 'vue';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-vue/select';
import { useTranslation } from '@/composables/useTranslation';
import { useAppConfigStore } from '@/store/pinia/appConfig';
import { LANGUAGE_CONFIGS } from '@/utils/constants';

// 语言选项配置（从 LANGUAGE_CONFIGS 派生）
const LANGUAGE_OPTIONS = LANGUAGE_CONFIGS.map((c) => ({
  value: c.code,
  label: `${c.flag} ${c.label}`,
}));

const props = defineProps<{
  /** 自定义容器类名 */
  class?: string;
}>();

const appConfigStore = useAppConfigStore();
const { t } = useTranslation();

// 切换进行中标志，防止并发切换
const isChanging = ref(false);

/**
 * 处理语言切换（异步，切换期间禁用选择器）
 * @param lang 目标语言代码
 */
const onLangChange = async (lang: string) => {
  // 与当前语言相同或切换进行中时忽略
  if (lang === appConfigStore.language || isChanging.value) return;

  isChanging.value = true;

  try {
    // store 内部处理 i18n 切换、持久化与成功/失败 Toast
    await appConfigStore.setAppLanguage(lang);
  } catch (error) {
    console.error('Failed to change language:', error);
  } finally {
    // 切换完成后延迟恢复选择器
    setTimeout(() => {
      isChanging.value = false;
    }, 500);
  }
};
</script>

<template>
  <div
    data-testid="language-setting"
    :class="`flex w-full items-center justify-between text-base ${props.class ?? ''}`"
  >
    <div>{{ t(($) => $.common.language) }}</div>
    <Select
      :model-value="appConfigStore.language"
      :disabled="isChanging"
      @update:model-value="onLangChange($event as string)"
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
