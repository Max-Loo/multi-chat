<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isUndefined } from 'es-toolkit';
import { Menu, Trash2 } from 'lucide-vue-next';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { FilterInput } from '@/components/FilterInput';
import type { ColumnDef } from '@tanstack/vue-table';
import { useBasicModelTable } from '@/composables/useBasicModelTable';
import { useModelsStore } from '@/store/models';
import { useChatStore } from '@/store/chat';
import { useChatPageStore } from '@/store/chatPage';
import { useChatPageSelectedChat } from '@/pages/Chat/composables/useSelectedChat';
import { useResponsive } from '@/composables/useResponsive';
import { toastQueue } from '@/services/toast';
import type { Model } from '@/types/model';

/**
 * 新建聊天的时候提供选择模型
 */
const { t } = useTranslation();
const modelsStore = useModelsStore();
const chatStore = useChatStore();
const chatPageStore = useChatPageStore();
const { isMobile } = useResponsive();
const { selectedChat } = useChatPageSelectedChat();

const { filterText, filteredModels, tableColumns } = useBasicModelTable();

// 选中的模型ID的列表
const checkedModelIdList = ref<string[]>([]);

/**
 * 添加选中的模型 ID
 * @param model 模型对象
 */
function addCheckModelId(model: Model): void {
  checkedModelIdList.value = [...checkedModelIdList.value, model.id];
}

/**
 * 删除选中的模型 ID
 * @param model 模型对象
 */
function deleteCheckModelId(model: Model): void {
  const idx = checkedModelIdList.value.findIndex((item) => item === model.id);
  if (idx !== -1) {
    const newList = [...checkedModelIdList.value];
    newList.splice(idx, 1);
    checkedModelIdList.value = newList;
  }
}

// 从 store 中计算出已选模型列表
const checkedModelList = computed<Model[]>(() => {
  const list: Model[] = [];
  checkedModelIdList.value.forEach((id) => {
    const model = modelsStore.models.find((item) => item.id === id);
    if (!isUndefined(model)) {
      list.push(model);
    }
  });
  return list;
});

// 表格相关配置（添加选择列）
const columns = computed<ColumnDef<Model>[]>(() => [
  {
    id: 'selected',
    header: '',
    cell: ({ row }) =>
      h(Checkbox, {
        modelValue: checkedModelIdList.value.includes(row.original.id),
        'onUpdate:modelValue': (checked: boolean) => {
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

/** 点击确定创建聊天：为当前聊天配置选中的模型 */
async function onConfirm(): Promise<void> {
  if (checkedModelIdList.value.length <= 0) {
    toastQueue.info(t('chat.selectModelHint'));
    return;
  }

  confirmLoading.value = true;

  try {
    await chatStore.editChat({
      chat: {
        ...selectedChat.value!,
        chatModelList: checkedModelIdList.value.map((id) => ({
          modelId: id,
          chatHistoryList: [],
        })),
      },
    });

    toastQueue.success(t('chat.configureChatSuccess'));
  } catch {
    toastQueue.error(t('chat.configureChatFailed'));
  }

  confirmLoading.value = false;
}

/** 打开抽屉 */
function openDrawer(): void {
  chatPageStore.toggleDrawer();
}
</script>

<template>
  <div>
    <div
      class="flex justify-between w-full h-12 pl-4 pr-4"
      role="toolbar"
      :aria-label="t('common.a11y.modelToolbar')"
    >
      <div class="flex flex-wrap items-center justify-start h-full">
        <!-- 打开模型供应商列表的按钮 -->
        <Button
          v-if="isMobile"
          variant="ghost"
          class="rounded mr-2 h-8 w-8 p-0"
          :aria-label="t('model.openProviderList')"
          @click="openDrawer"
        >
          <Menu class="h-5 w-5" />
        </Button>

        <!-- 快速清空选中 -->
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

        <!-- 已选模型徽标 -->
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
      <div class="flex items-center justify-end h-full">
        <Button :disabled="confirmLoading" @click="onConfirm">
          {{ t('common.confirm') }}
        </Button>
        <FilterInput
          v-model="filterText"
          :placeholder="t('chat.searchPlaceholder')"
          class="h-8 ml-2 w-72!"
        />
      </div>
    </div>

    <!-- 模型列表 -->
    <DataTable
      :columns="columns"
      :data="filteredModels"
      row-key="id"
      :loading="modelsStore.loading"
      class="ml-1 mr-1"
    />
  </div>
</template>
