<script setup lang="ts">
/**
 * 模型选择视图（Vue 版 ModelSelect）
 * 新建聊天时配置聊天模型：模型多选表格、确认按钮、搜索过滤、已选标签预览
 */
import { computed, h, ref } from 'vue';
import type { ColumnDef, TableFeatures } from '@tanstack/table-core';
import { Menu, Trash2 } from 'lucide-vue-next';
import { isUndefined } from 'es-toolkit';
import FilterInput from '@/components/FilterInput.vue';
import { Button } from '@/components/ui-vue/button';
import { Checkbox } from '@/components/ui-vue/checkbox';
import { Badge } from '@/components/ui-vue/badge';
import { DataTable } from '@/components/ui-vue/data-table';
import { useCurrentSelectedChat } from '@/composables/useCurrentSelectedChat';
import { useBasicModelTable } from '@/composables/useBasicModelTable';
import { useResponsive } from '@/composables/useResponsive';
import { useChatStore } from '@/store/pinia/chat';
import { useChatPageStore } from '@/store/pinia/chatPage';
import { useModelStore } from '@/store/pinia/model';
import { toastQueue } from '@/services/toast';
import { useTranslation } from '@/composables/useTranslation';
import type { Chat } from '@/types/chat';
import type { Model } from '@/types/model';

const { t } = useTranslation();
const { isMobile } = useResponsive();
const chatStore = useChatStore();
const chatPageStore = useChatPageStore();
const modelStore = useModelStore();
const selectedChat = useCurrentSelectedChat();

// Content 三级分支保证本组件仅在已选中聊天时渲染
const typedSelectedChat = computed(() => selectedChat.value as Chat);

const { filterText, filteredModels, setFilterText, tableColumns } = useBasicModelTable();

const models = computed(() => modelStore.models);
const loading = computed(() => modelStore.loading);

// 选中的模型ID的列表
const checkedModelIdList = ref<string[]>([]);

/** 添加选中的ID */
const addCheckModelId = (model: Model) => {
  checkedModelIdList.value = [...checkedModelIdList.value, model.id];
};

/** 删除选中的ID */
const deleteCheckModelId = (model: Model) => {
  const idx = checkedModelIdList.value.findIndex((item) => item === model.id);
  if (idx !== -1) {
    const newList = [...checkedModelIdList.value];
    newList.splice(idx, 1);
    checkedModelIdList.value = newList;
  }
};

// 从 Store 中计算出已选模型列表
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
const columns = computed<ColumnDef<TableFeatures, Model>[]>(() => [
  {
    id: 'selected',
    header: '',
    cell: ({ row }) =>
      h(Checkbox, {
        modelValue: checkedModelIdList.value.includes(row.original.id),
        'onUpdate:modelValue': (checked: boolean | 'indeterminate') => {
          if (checked) {
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

/** 点击确定创建聊天（写入聊天模型配置） */
const onConfirm = async () => {
  if (checkedModelIdList.value.length <= 0) {
    toastQueue.info(t('chat.selectModelHint') as string);
    return;
  }

  confirmLoading.value = true;

  try {
    await chatStore.editChat({
      chat: {
        ...typedSelectedChat.value,
        chatModelList: checkedModelIdList.value.map((id) => ({
          modelId: id,
          chatHistoryList: [],
        })),
      },
    });

    toastQueue.success(t('chat.configureChatSuccess') as string);
  } catch {
    toastQueue.error(t('chat.configureChatFailed') as string);
  }

  confirmLoading.value = false;
};
</script>

<template>
  <div class="flex h-full w-full flex-col">
    <div class="flex h-12 w-full justify-between pl-4 pr-4" role="toolbar" :aria-label="t('common.a11y.modelToolbar') as string">
      <div class="flex h-full flex-wrap items-center justify-start">
        <!-- 打开模型供应商列表的按钮 -->
        <Button
          v-if="isMobile"
          variant="ghost"
          class="mr-2 h-8 w-8 rounded p-0"
          :aria-label="t('model.openProviderList') as string"
          @click="chatPageStore.toggleDrawer()"
        >
          <Menu class="h-5 w-5" />
        </Button>
        <!-- 快速预览选中模型 -->
        <Button
          v-if="checkedModelList.length > 0"
          variant="outline"
          size="sm"
          class="mr-2"
          :aria-label="t('common.a11y.clearSelection') as string"
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
          :placeholder="t('chat.searchPlaceholder') as string"
          class="ml-2 h-8 w-72!"
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
