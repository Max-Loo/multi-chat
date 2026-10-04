<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTranslation } from 'i18next-vue';
import { Pencil, Plus, Trash2 } from 'lucide-vue-next';
import type { ColumnDef } from '@tanstack/vue-table';
import { FilterInput } from '@/components/FilterInput';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useBasicModelTable } from '@/composables/useBasicModelTable';
import { useModelsStore } from '@/store/models';
import { toastQueue } from '@/services/toast';
import type { Model } from '@/types/model';
import EditModelModal from './components/EditModelModal.vue';

/**
 * 模型表格主组件
 */
const { t } = useTranslation();
const router = useRouter();
const modelsStore = useModelsStore();

// 当前点击需要编辑的模型
const currentEditingModel = ref<Model>();
// 控制编辑模型弹窗的开关
const isModalOpen = ref(false);
// 控制删除确认弹窗的开关
const deleteConfirmOpen = ref(false);
// 当前需要删除的模型
const modelToDelete = ref<Model>();

/** 处理删除模型 */
async function handleDeleteModel(model: Model): Promise<void> {
  try {
    await modelsStore.deleteModel({ model });
    toastQueue.success(t('model.deleteModelSuccess'));
    deleteConfirmOpen.value = false;
  } catch {
    toastQueue.error(t('model.deleteModelFailed'));
  }
}

/** 处理添加模型按钮点击：跳转到添加模型页面 */
function handleAddModel(): void {
  router.push('/model/add');
}

/** 处理点击编辑模型按钮 */
function handleEditModel(value: Model): void {
  currentEditingModel.value = value;
  isModalOpen.value = true;
}

/** 关闭编辑模型弹窗的回调 */
function onModalCancel(): void {
  isModalOpen.value = false;
}

// 一些基础的和模型列表相关的封装逻辑
const { tableColumns, filterText, filteredModels } = useBasicModelTable();

/**
 * 操作列单元格（含编辑按钮与删除确认 Popover）
 * @param row 当前行上下文
 */
function renderActionsCell(row: { original: Model }) {
  return h('div', { class: 'flex items-center gap-2' }, [
    h(
      Button,
      {
        variant: 'ghost',
        size: 'icon',
        'aria-label': t('table.operation'),
        onClick: () => handleEditModel(row.original),
      },
      () => h(Pencil),
    ),
    h(
      Popover,
      {
        open: deleteConfirmOpen.value && modelToDelete.value?.id === row.original.id,
        'onUpdate:open': (open: boolean) => (deleteConfirmOpen.value = open),
      },
      {
        default: () => [
          h(
            PopoverTrigger,
            { asChild: true },
            {
              default: () =>
                h(
                  Button,
                  {
                    variant: 'ghost',
                    size: 'icon',
                    'aria-label': t('model.confirmDelete'),
                    onClick: () => (modelToDelete.value = row.original),
                  },
                  () => h(Trash2),
                ),
            },
          ),
          h(
            PopoverContent,
            { class: 'w-80', align: 'start' },
            {
              default: () =>
                h('div', { class: 'space-y-3' }, [
                  h('p', { class: 'font-medium' }, t('model.confirmDelete')),
                  h(
                    'p',
                    { class: 'text-sm text-muted-foreground' },
                    t('model.confirmDeleteDescription', {
                      nickname: row.original.nickname,
                    }),
                  ),
                  h('div', { class: 'flex justify-end gap-2 pt-2' }, [
                    h(
                      Button,
                      {
                        variant: 'outline',
                        size: 'sm',
                        onClick: () => (deleteConfirmOpen.value = false),
                      },
                      () => t('common.cancel'),
                    ),
                    h(
                      Button,
                      {
                        variant: 'destructive',
                        size: 'sm',
                        class: 'text-white',
                        onClick: () => handleDeleteModel(row.original),
                      },
                      () => t('common.confirm'),
                    ),
                  ]),
                ]),
            },
          ),
        ],
      },
    ),
  ]);
}

// 表格列定义（包含操作列）
const columns = computed<ColumnDef<Model>[]>(() => [
  ...tableColumns.value,
  {
    id: 'actions',
    header: () => t('table.operation'),
    cell: ({ row }) => renderActionsCell(row),
  },
]);
</script>

<!-- 模型表格主组件 -->
<template>
  <div class="h-full overflow-y-auto p-6">
    <!-- 显示初始化错误 -->
    <Alert v-if="modelsStore.initializationError" variant="destructive" class="mb-4">
      <AlertTitle>{{ t('model.dataLoadFailed') }}</AlertTitle>
      <AlertDescription>{{ modelsStore.initializationError }}</AlertDescription>
    </Alert>

    <!-- 显示操作错误 -->
    <Alert v-if="modelsStore.error" variant="destructive" class="mb-4">
      <AlertTitle>{{ t('model.operationFailed') }}</AlertTitle>
      <AlertDescription>{{ modelsStore.error }}</AlertDescription>
    </Alert>

    <!-- 表格头部：添加按钮和过滤器 -->
    <div class="flex items-center justify-between mt-2 mb-4">
      <Button data-testid="add-model-button" @click="handleAddModel">
        <Plus class="mr-2 h-4 w-4" />
        {{ t('model.addModel') }}
      </Button>
      <FilterInput
        v-model="filterText"
        class="w-72!"
        :placeholder="t('model.searchPlaceholder')"
      />
    </div>

    <!-- 模型数据表格 -->
    <DataTable
      :columns="columns"
      :data="filteredModels"
      row-key="id"
      :loading="modelsStore.loading"
      :empty-text="
        modelsStore.initializationError
          ? t('model.fixErrorReload')
          : t('model.noModelData')
      "
    />

    <!-- 编辑模型弹窗 -->
    <EditModelModal
      :model-provider-key="currentEditingModel?.providerKey"
      :model-params="currentEditingModel"
      :is-modal-open="isModalOpen"
      @modal-cancel="onModalCancel"
    />
  </div>
</template>
