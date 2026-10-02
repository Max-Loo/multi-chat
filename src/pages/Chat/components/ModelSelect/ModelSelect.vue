<script setup lang="ts">
/**
 * 新建聊天时选择模型的组件（对应旧版 ModelSelect/index.tsx）
 */
import { computed, h, ref } from 'vue';
import { storeToRefs } from 'pinia';
import FilterInput from '@/components/FilterInput/FilterInput.vue';
import { useModelStore, useChatStore, useChatPageStore } from '@/stores';
import { useBasicModelTable } from '@/composables/useBasicModelTable';
import { useCurrentSelectedChat } from '@/composables/useCurrentSelectedChat';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';
import type { Model } from '@/types/model';
import type { ColumnDef } from '@tanstack/vue-table';
import { Trash2, Menu } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { toastQueue } from '@/services/toast';
import { isUndefined } from 'es-toolkit';

const { t } = useTranslation();
const { isMobile } = useResponsive();
const chatStore = useChatStore();
const modelStore = useModelStore();
const chatPageStore = useChatPageStore();
const { models, loading } = storeToRefs(modelStore);
const selectedChat = useCurrentSelectedChat();

/** 打开抽屉 */
const openDrawer = (): void => {
  chatPageStore.toggleDrawer();
};

const { filterText, filteredModels, setFilterText, tableColumns } =
  useBasicModelTable();

// 选中的模型 ID 列表
const checkedModelIdList = ref<string[]>([]);

/** 添加选中的 ID */
const addCheckModelId = (model: Model): void => {
  checkedModelIdList.value = [...checkedModelIdList.value, model.id];
};

/** 删除选中的 ID */
const deleteCheckModelId = (model: Model): void => {
  checkedModelIdList.value = checkedModelIdList.value.filter(
    (id) => id !== model.id,
  );
};

// 已选中模型的完整对象列表
const checkedModelList = computed<Model[]>(() => {
  const list: Model[] = [];
  checkedModelIdList.value.forEach((id) => {
    const model = models.value.find((item) => item.id === id);
    if (!isUndefined(model)) {
      list.push(model);
    }
  });
  return list;
});

// 表格相关配置（添加选择列）
const columns = computed<ColumnDef<Model, unknown>[]>(() => [
  {
    id: 'selected',
    header: '',
    cell: ({ row }) =>
      h(Checkbox, {
        modelValue: checkedModelIdList.value.includes(row.original.id),
        'onUpdate:modelValue': (checked: boolean | 'indeterminate') => {
          if (checked === true) {
            addCheckModelId(row.original);
          } else {
            deleteCheckModelId(row.original);
          }
        },
      }),
  },
  ...tableColumns.value,
]);

// 确认按钮的 loading 状态
const confirmLoading = ref(false);

/** 点击确定创建聊天 */
const onConfirm = async (): Promise<void> => {
  if (checkedModelIdList.value.length <= 0) {
    void toastQueue.info(t('chat.selectModelHint'));
    return;
  }

  confirmLoading.value = true;

  try {
    chatStore.editChat({
      ...selectedChat.value!,
      chatModelList: checkedModelIdList.value.map((id) => ({
        modelId: id,
        chatHistoryList: [],
      })),
    });

    void toastQueue.success(t('chat.configureChatSuccess'));
  } catch {
    void toastQueue.error(t('chat.configureChatFailed'));
  }

  confirmLoading.value = false;
};
</script>

<template>
  <div>
    <div
      class="flex h-12 w-full justify-between pl-4 pr-4"
      role="toolbar"
      :aria-label="t('common.a11y.modelToolbar')"
    >
      <div class="flex h-full flex-wrap items-center justify-start">
        <!-- 打开模型供应商列表的按钮 -->
        <Button
          v-if="isMobile"
          variant="ghost"
          class="mr-2 h-8 w-8 rounded p-0"
          :aria-label="t('model.openProviderList')"
          @click="openDrawer"
        >
          <Menu class="h-5 w-5" />
        </Button>
        <!-- 快速预览选中模型 -->
        <Button
          v-if="checkedModelList.length > 0"
          variant="outline"
          size="sm"
          class="mr-2"
          :aria-label="t('common.a11y.clearSelection')"
          @click="checkedModelIdList = []"
        >
          <Trash2 class="h-4 w-4" />
        </Button>
        <Badge
          v-for="model in checkedModelList"
          :key="model.id"
          variant="secondary"
          class="mr-1 cursor-pointer"
          @click="deleteCheckModelId(model)"
        >
          {{ model.nickname }}
          <button
            class="ml-1 hover:text-destructive"
            @click.stop="deleteCheckModelId(model)"
          >
            ×
          </button>
        </Badge>
      </div>
      <!-- 操作区域 -->
      <div class="flex h-full items-center justify-end">
        <Button :disabled="confirmLoading" @click="onConfirm">
          {{ t('common.confirm') }}
        </Button>
        <FilterInput
          :model-value="filterText"
          @update:model-value="setFilterText"
          :placeholder="t('chat.searchPlaceholder')"
          class-name="ml-2 w-72!"
        />
      </div>
    </div>
    <!-- 模型列表 -->
    <DataTable
      :columns="columns"
      :data="filteredModels"
      row-key="id"
      :loading="loading"
      class="ml-1 mr-1"
    />
  </div>
</template>
