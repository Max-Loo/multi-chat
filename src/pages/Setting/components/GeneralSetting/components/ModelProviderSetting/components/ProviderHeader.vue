<script setup lang="ts">
/**
 * 供应商设置页面头部组件（对应旧版 ProviderHeader.tsx）
 * 显示标题、刷新按钮和最后更新时间
 */
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-vue-next';
import { useTranslation } from '@/composables/useTranslation';

/** 组件属性 */
const props = defineProps<{
  /** 是否正在加载 */
  loading: boolean;
  /** 最后更新时间（ISO 8601 格式） */
  lastUpdate: string | null;
}>();

/** 刷新按钮点击事件 */
const emit = defineEmits<{ refresh: [] }>();

const { t, language } = useTranslation();

/** 格式化最后更新时间 */
const formatLastUpdate = computed(() => {
  if (!props.lastUpdate) return null;
  const date = new Date(props.lastUpdate);
  const locale = language.value === 'zh' ? 'zh-CN' : 'en-US';
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-start justify-between">
      <div>
        <h3 class="text-lg font-semibold">
          {{ t('setting.modelProvider.title') }}
        </h3>
        <p class="text-sm text-muted-foreground">
          {{ t('setting.modelProvider.description') }}
        </p>
      </div>

      <div class="flex flex-col items-end gap-2">
        <Button variant="outline" size="sm" :disabled="props.loading" @click="emit('refresh')">
          <RefreshCw :class="`mr-2 h-4 w-4 ${props.loading ? 'animate-spin' : ''}`" />
          {{
            props.loading
              ? t('setting.modelProvider.refreshing')
              : t('setting.modelProvider.refreshButton')
          }}
        </Button>

        <div v-if="props.lastUpdate" class="text-sm text-muted-foreground">
          {{ t('setting.modelProvider.lastUpdateLabel') }} {{ formatLastUpdate }}
        </div>
      </div>
    </div>
  </div>
</template>
