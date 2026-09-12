<script setup lang="ts">
/**
 * 模型选择侧边栏（Vue 版 ModelSidebar）
 * 支持按钮元素压缩：根据屏幕尺寸调整按钮、Avatar 和文字大小
 */
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import FilterInput from '@/components/FilterInput.vue';
import { Button } from '@/components/ui-vue/button';
import { Avatar } from '@/components/ui-vue/avatar';
import { useDebouncedFilter } from '@/composables/useDebouncedFilter';
import { useModelProviderStore } from '@/store/pinia/modelProvider';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';
import { getProviderLogoUrl } from '@/utils/providerUtils';
import type { ModelProviderKeyEnum } from '@/utils/enums';

const props = defineProps<{
  // 当前选中的大模型
  value: ModelProviderKeyEnum;
}>();

const emit = defineEmits<{ (e: 'change', value: ModelProviderKeyEnum): void }>();

const { t } = useTranslation();
const router = useRouter();
const { isDesktop, isMobile } = useResponsive();
const providerStore = useModelProviderStore();

// 从 Store 获取所有供应商
const providers = computed(() => providerStore.providers);

// 本地状态：过滤文本
const filterText = ref('');
const {
  filteredList: filteredProviders,
} = useDebouncedFilter(
  filterText,
  providers,
  (provider) =>
    provider.providerName.toLocaleLowerCase().includes(filterText.value.toLocaleLowerCase()),
);

// 按钮样式根据屏幕尺寸压缩
const buttonClassName = computed(
  () => `w-full flex justify-start rounded-none ${!isDesktop.value ? 'py-4' : 'py-5'}`,
);

// Avatar 大小根据屏幕尺寸压缩
const avatarClassName = computed(() => `${!isDesktop.value ? 'h-7 w-7' : 'h-8 w-8'}`);

// 文字大小根据屏幕尺寸压缩
const textSize = computed(() => `${!isDesktop.value ? 'text-sm' : 'text-base'}`);

// 容器 padding 根据屏幕尺寸调整
const containerPadding = computed(() => (!isDesktop.value ? 'p-1' : 'p-2'));
</script>

<template>
  <nav
    :aria-label="t('common.a11y.modelProviderNav') as string"
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
          <ArrowLeft size="16" />
        </Button>
        <span class="text-lg">{{ t('model.modelProvider') }}</span>
      </div>
      <FilterInput
        v-model="filterText"
        :placeholder="t('model.searchModel') as string"
        class="w-full rounded-lg"
      />
    </div>
    <!-- 可供选择的供应商列表 -->
    <div class="w-full pb-2">
      <Button
        v-for="provider in filteredProviders"
        :key="provider.providerKey"
        variant="ghost"
        :class="`${buttonClassName} ${provider.providerKey === props.value ? 'bg-gray-200' : ''}`"
        :aria-current="provider.providerKey === props.value ? 'page' : undefined"
        :title="provider.providerName"
        @click="emit('change', provider.providerKey as ModelProviderKeyEnum)"
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
