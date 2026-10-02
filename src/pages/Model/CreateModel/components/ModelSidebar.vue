<script setup lang="ts">
/**
 * 模型选择侧边栏（对应旧版 ModelSidebar.tsx）
 * 支持按钮元素压缩：根据屏幕尺寸调整按钮、Avatar 和文字大小
 */
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useDebouncedFilter } from '@/composables/useDebouncedFilter';
import FilterInput from '@/components/FilterInput/FilterInput.vue';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { ArrowLeft } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useModelProviderStore } from '@/stores';
import { useTranslation } from '@/composables/useTranslation';
import { useResponsive } from '@/composables/useResponsive';
import { getProviderLogoUrl } from '@/utils/providerUtils';

/** 组件属性 */
const props = defineProps<{
  /** 当前选中的大模型供应商 */
  modelValue: ModelProviderKeyEnum;
}>();

/** 选中变化事件 */
const emit = defineEmits<{
  'update:modelValue': [value: ModelProviderKeyEnum];
}>();

const { t } = useTranslation();
const router = useRouter();
const { isDesktop, isMobile } = useResponsive();
const modelProviderStore = useModelProviderStore();
const { providers } = storeToRefs(modelProviderStore);

// 本地状态：过滤文本
const filterText = ref('');
const { filteredList: filteredProviders } = useDebouncedFilter(
  () => filterText.value,
  () => providers.value,
  (provider) =>
    provider.providerName
      .toLocaleLowerCase()
      .includes(filterText.value.toLocaleLowerCase()),
);

// 按钮样式根据屏幕尺寸压缩
const buttonClassName = computed(
  () =>
    `flex w-full justify-start rounded-none ${!isDesktop.value ? 'py-4' : 'py-5'}`,
);

// Avatar 大小根据屏幕尺寸压缩
const avatarClassName = computed(() => (!isDesktop.value ? 'h-7 w-7' : 'h-8 w-8'));

// 文字大小根据屏幕尺寸压缩
const textSize = computed(() => (!isDesktop.value ? 'text-sm' : 'text-base'));

// 容器 padding 根据屏幕尺寸调整
const containerPadding = computed(() => (!isDesktop.value ? 'p-1' : 'p-2'));
</script>

<template>
  <nav
    :aria-label="t('common.a11y.modelProviderNav')"
    :class="`flex h-full w-60 flex-col items-center justify-start ${containerPadding}`"
  >
    <!-- 表头部分 -->
    <div :class="`w-full border-b border-gray-300 ${!isDesktop ? 'p-1' : 'p-2'}`">
      <div class="flex w-full items-center justify-between pb-2">
        <!-- 返回上一页按钮 -->
        <Button
          v-if="!isMobile"
          variant="ghost"
          class="h-8 w-8 rounded-lg p-0"
          @click="router.push('/model/table')"
        >
          <ArrowLeft :size="16" />
        </Button>
        <span class="text-lg">{{ t('model.modelProvider') }}</span>
      </div>
      <FilterInput
        v-model:model-value="filterText"
        :placeholder="t('model.searchModel')"
        class-name="w-full rounded-lg"
      />
    </div>
    <!-- 可供选择的供应商 -->
    <div class="w-full pb-2">
      <Button
        v-for="provider in filteredProviders"
        :key="provider.providerKey"
        variant="ghost"
        :class="`${buttonClassName} ${
          provider.providerKey === props.modelValue && 'bg-gray-200'
        }`"
        :aria-current="provider.providerKey === props.modelValue ? 'page' : undefined"
        :title="provider.providerName"
        @click="emit('update:modelValue', provider.providerKey as ModelProviderKeyEnum)"
      >
        <Avatar :class="avatarClassName">
          <img
            :src="getProviderLogoUrl(provider.providerKey)"
            :alt="provider.providerName"
          />
        </Avatar>
        <span :class="`pl-2 ${textSize}`">
          {{ provider.providerName }}
        </span>
      </Button>
    </div>
  </nav>
</template>
