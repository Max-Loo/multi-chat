<script setup lang="ts">
/**
 * 模型表格页面（对应旧版 ModelTable/index.tsx）
 * 含编辑弹窗与删除确认气泡
 */
import { computed, h, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Plus, Pencil, Trash2 } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useModelStore } from '@/stores';
import FilterInput from '@/components/FilterInput/FilterInput.vue';
import EditModelModal from './components/EditModelModal.vue';
import { useBasicModelTable } from '@/composables/useBasicModelTable';
import { useTranslation } from '@/composables/useTranslation';
import { toastQueue } from '@/services/toast';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ColumnDef } from '@tanstack/vue-table';
import type { Model } from '@/types/model';

const modelStore = useModelStore();
const { loading, error, initializationError } = storeToRefs(modelStore);
const { t } = useTranslation();
const router = useRouter();

// 当前点击需要编辑的模型
const currentEditingModel = ref<Model>();
// 控制编辑模型弹窗的开关
const isModalOpen = ref(false);
// 控制删除确认弹窗的开关
const deleteConfirmOpen = ref(false);
// 当前需要删除的模型
const modelToDelete = ref<Model>();

/** 处理删除模型 */
const handleDeleteModel = (model: Model): void => {
  try {
    modelStore.deleteModel(model);
    void toastQueue.success(t('model.deleteModelSuccess'));
    deleteConfirmOpen.value = false;
  } catch {
    void toastQueue.error(t('model.deleteModelFailed'));
  }
};

/** 处理添加模型按钮点击 */
const handleAddModel = (): void => {
  void router.push('/model/add');
};

/** 处理点击编辑模型按钮 */
const handleEditModel = (value: Model): void => {
  currentEditingModel.value = value;
  isModalOpen.value = true;
};

/** 关闭编辑模型弹窗的回调 */
const onModalCancel = (): void => {
  isModalOpen.value = false;
};

// 基础的模型列表相关封装逻辑
const { tableColumns, filterText, filteredModels, setFilterText } =
  useBasicModelTable();

// 表格列定义（包含操作列）
const columns = computed<ColumnDef<Model, unknown>[]>(() => [
  ...tableColumns.value,
  {
    id: 'actions',
    header: t('table.operation'),
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2' }, [
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
        // 删除确认气泡
        // 注意：Popover（PopoverRoot）只渲染默认插槽，trigger 必须并入 default，
        // 否则删除按钮不会被渲染（迁移回归修复）
        h(
          Popover,
          {
            open:
              deleteConfirmOpen.value && modelToDelete.value?.id === row.original.id,
            'onUpdate:open': (value: boolean) => (deleteConfirmOpen.value = value),
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
      ]),
  },
]);
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <!-- 显示初始化错误 -->
    <Alert v-if="initializationError" variant="destructive" class="mb-4">
      <AlertTitle>{{ t('model.dataLoadFailed') }}</AlertTitle>
      <AlertDescription>{{ initializationError }}</AlertDescription>
    </Alert>

    <!-- 显示操作错误 -->
    <Alert v-if="error" variant="destructive" class="mb-4">
      <AlertTitle>{{ t('model.operationFailed') }}</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- 表格头部：添加按钮和过滤器 -->
    <div class="mt-2 mb-4 flex items-center justify-between">
      <Button @click="handleAddModel">
        <Plus class="mr-2 h-4 w-4" />
        {{ t('model.addModel') }}
      </Button>
      <FilterInput
        :model-value="filterText"
        class-name="w-72!"
        :placeholder="t('model.searchPlaceholder')"
        @update:model-value="setFilterText"
      />
    </div>

    <!-- 模型数据表格 -->
    <DataTable
      :columns="columns"
      :data="filteredModels"
      row-key="id"
      :loading="loading"
      :empty-text="
        initializationError
          ? t('model.fixErrorReload')
          : t('model.noModelData')
      "
    />
    <EditModelModal
      :model-provider-key="currentEditingModel?.providerKey"
      :model-params="currentEditingModel"
      :is-modal-open="isModalOpen"
      @cancel="onModalCancel"
    />
  </div>
</template>
