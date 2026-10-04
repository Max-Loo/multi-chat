<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { ArrowLeft } from 'lucide-vue-next';
import { FilterInput } from '@/components/FilterInput';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useModelProviderStore } from '@/store/modelProvider';
import { useDebouncedFilter } from '@/composables/useDebouncedFilter';
import { useResponsive } from '@/composables/useResponsive';
import { useRouter } from 'vue-router';
import { getProviderLogoUrl } from '@/utils/providerUtils';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { RemoteProviderData } from '@/services/modelRemote';

/**
 * 模型选择侧边栏属性
 */
interface ModelSidebarProps {
  /** 当前选中的大模型供应商 */
  modelProviderKey: ModelProviderKeyEnum;
}

const props = defineProps<ModelSidebarProps>();

const emit = defineEmits<{
  /** 选中供应商变化 */
  (e: 'update:modelProviderKey', value: ModelProviderKeyEnum): void;
}>();

const { t } = useTranslation();
const router = useRouter();
const { isDesktop, isMobile } = useResponsive();
const modelProviderStore = useModelProviderStore();

// 从 store 获取所有供应商
const providers = computed(() => modelProviderStore.providers);

// 本地状态：过滤文本
const filterText = ref('');
const { filteredList: filteredProviders } = useDebouncedFilter(
  filterText,
  providers,
  (provider: RemoteProviderData) =>
    provider.providerName
      .toLocaleLowerCase()
      .includes(filterText.value.toLocaleLowerCase()),
);

/** 返回模型列表页 */
function handleBack(): void {
  router.push('/model/table');
}
</script>

<!--
  模型选择侧边栏
  支持按钮元素压缩：根据屏幕尺寸调整按钮、Avatar 和文字大小
-->
<template>
  <nav
    :aria-label="t('common.a11y.modelProviderNav')"
    :class="['flex flex-col items-center justify-start h-full w-60', !isDesktop ? 'p-1' : 'p-2']"
  >
    <!-- 表头部分 -->
    <div :class="['border-b border-gray-300 w-full', !isDesktop ? 'p-1' : 'p-2']">
      <div class="flex items-center justify-between w-full pb-2">
        <!-- 返回上一页按钮 -->
        <Button
          v-if="!isMobile"
          variant="ghost"
          class="rounded-lg h-8 w-8 p-0"
          aria-label="返回"
          @click="handleBack"
        >
          <ArrowLeft :size="16" />
        </Button>
        <span class="text-lg">{{ t('model.modelProvider') }}</span>
      </div>
      <FilterInput
        v-model="filterText"
        :placeholder="t('model.searchModel')"
        class="w-full rounded-lg"
      />
    </div>

    <!-- 可供选择的供应商列表 -->
    <div class="pb-2 w-full">
      <Button
        v-for="provider in filteredProviders"
        :key="provider.providerKey"
        variant="ghost"
        :class="[
          'w-full flex justify-start rounded-none',
          !isDesktop ? 'py-4' : 'py-5',
          provider.providerKey === props.modelProviderKey && 'bg-gray-200',
        ]"
        :aria-current="
          provider.providerKey === props.modelProviderKey ? 'page' : undefined
        "
        :title="provider.providerName"
        @click="
          emit('update:modelProviderKey', provider.providerKey as ModelProviderKeyEnum)
        "
      >
        <Avatar :class="!isDesktop ? 'h-7 w-7' : 'h-8 w-8'">
          <img
            :src="getProviderLogoUrl(provider.providerKey)"
            :alt="provider.providerName"
          />
        </Avatar>
        <span :class="['pl-2', !isDesktop ? 'text-sm' : 'text-base']">
          {{ provider.providerName }}
        </span>
      </Button>
    </div>
  </nav>
</template>
