<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppConfigStore } from '@/store/appConfig';
import { changeAppLanguage } from '@/services/i18n';
import { toastQueue } from '@/services/toast';
import { LANGUAGE_CONFIGS } from '@/utils/constants';

/**
 * 语言设置组件
 */
const props = defineProps<{ class?: string }>();

const appConfigStore = useAppConfigStore();
const { t } = useTranslation();

const language = computed(() => appConfigStore.language);

// 语言选项配置（从 LANGUAGE_CONFIGS 派生）
const languageOptions = LANGUAGE_CONFIGS.map((c) => ({
  value: c.code,
  label: `${c.flag} ${c.label}`,
}));

// 是否正在切换语言
const isChanging = ref(false);

/**
 * 语言切换回调
 * @param lang 目标语言
 */
async function onLangChange(lang: string): Promise<void> {
  // 在函数开始时检查
  if (lang === language.value || isChanging.value) return;

  // 在切换开始时设置 isChanging(true)
  isChanging.value = true;

  try {
    // 调用 i18n 的语言切换函数
    const { success } = await changeAppLanguage(lang);

    if (success) {
      // 切换成功，更新 store（内部自动持久化到 localStorage）
      await appConfigStore.setAppLanguage(lang);
    } else {
      // 切换失败，显示错误提示
      toastQueue.error(t('setting.languageSwitchFailed'));
    }
  } catch (error) {
    console.error('Failed to change language:', error);
    toastQueue.error(t('setting.languageSwitchFailed'));
  } finally {
    // 在 try-finally 中恢复状态
    setTimeout(() => {
      isChanging.value = false;
    }, 500);
  }
}

void props;
</script>

<!-- 语言设置组件 -->
<template>
  <div
    data-testid="language-setting"
    :class="['flex items-center justify-between w-full text-base', props.class]"
  >
    <div>{{ t('common.language') }}</div>
    <Select
      :model-value="language"
      :disabled="isChanging"
      @update:model-value="(value: unknown) => onLangChange(String(value))"
    >
      <SelectTrigger class="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="option in languageOptions" :key="option.value" :value="option.value">
          <div>{{ option.label }}</div>
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
