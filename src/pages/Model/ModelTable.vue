<script setup lang="ts">
/**
 * 模型表格主组件（Vue 版 ModelTable）
 * 模型列表展示、搜索过滤、添加入口、编辑弹窗与删除确认
 */
import { computed, h, ref } from 'vue';
import { Plus, Pencil, Trash2 } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import FilterInput from '@/components/FilterInput.vue';
import EditModelModal from './ModelTable/components/EditModelModal.vue';
import { useBasicModelTable } from '@/composables/useBasicModelTable';
import { Popover } from '@/components/ui-vue/popover';
import { DataTable } from '@/components/ui-vue/data-table';
import { Button } from '@/components/ui-vue/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui-vue/alert';
import { useModelStore } from '@/store/pinia/model';
import { useTranslation } from '@/composables/useTranslation';
import { toastQueue } from '@/services/toast';
import type { ColumnDef, TableFeatures } from '@tanstack/vue-table';
import type { Model } from '@/types/model';

const { t } = useTranslation();
const router = useRouter();
const modelStore = useModelStore();

const loading = computed(() => modelStore.loading);
const error = computed(() => modelStore.error);
const initializationError = computed(() => modelStore.initializationError);

// 一些基础的和模型列表相关的封装逻辑
const { tableColumns, filterText, filteredModels, setFilterText } = useBasicModelTable();

// 当前点击需要编辑的模型
const currentEditingModel = ref<Model>();
// 控制编辑模型弹窗的开关
const isModalOpen = ref(false);
// 控制删除确认弹窗的开关
const deleteConfirmOpen = ref(false);
// 当前需要删除的模型
const modelToDelete = ref<Model>();

/** 处理点击编辑模型按钮 */
const handleEditModel = (value: Model) => {
  currentEditingModel.value = value;
  isModalOpen.value = true;
};

/** 关闭编辑模型弹窗的回调 */
const onModalCancel = () => {
  isModalOpen.value = false;
};

/** 处理删除模型 */
const handleDeleteModel = (model: Model): void => {
  modelStore
    .deleteModel({ model })
    .then(() => {
      toastQueue.success(t('model.deleteModelSuccess') as string);
      deleteConfirmOpen.value = false;
    })
    .catch(() => {
      toastQueue.error(t('model.deleteModelFailed') as string);
    });
};

/** 处理添加模型按钮点击：跳转到添加模型页面 */
const handleAddModel = () => {
  void router.push('/model/add');
};

// 表格列定义（包含操作列）
const columns = computed<ColumnDef<TableFeatures, Model>[]>(() => [
  ...tableColumns.value,
  {
    id: 'actions',
    header: t('table.operation') as string,
    cell: ({ row }) => {
      const model = row.original;
      return h('div', { class: 'flex items-center gap-2' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon',
            'aria-label': t('table.operation') as string,
            onClick: () => handleEditModel(model),
          },
          { default: () => h(Pencil) },
        ),
        h(
          Popover,
          {
            open: deleteConfirmOpen.value && modelToDelete.value?.id === model.id,
            'onUpdate:open': (open: boolean) => {
              deleteConfirmOpen.value = open;
            },
          },
          {
            trigger: () =>
              h(
                Button,
                {
                  variant: 'ghost',
                  size: 'icon',
                  'aria-label': t('model.confirmDelete') as string,
                  onClick: () => {
                    modelToDelete.value = model;
                  },
                },
                { default: () => h(Trash2) },
              ),
            default: () =>
              h('div', { class: 'space-y-3' }, [
                h('p', { class: 'font-medium' }, t('model.confirmDelete') as string),
                h(
                  'p',
                  { class: 'text-sm text-muted-foreground' },
                  (t('model.confirmDeleteDescription', { nickname: model.nickname }) as string),
                ),
                h('div', { class: 'flex justify-end gap-2 pt-2' }, [
                  h(
                    Button,
                    {
                      variant: 'outline',
                      size: 'sm',
                      onClick: () => {
                        deleteConfirmOpen.value = false;
                      },
                    },
                    { default: () => t('common.cancel') as string },
                  ),
                  h(
                    Button,
                    {
                      variant: 'destructive',
                      size: 'sm',
                      class: 'text-white',
                      onClick: () => handleDeleteModel(model),
                    },
                    { default: () => t('common.confirm') as string },
                  ),
                ]),
              ]),
          },
        ),
      ]);
    },
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
    <div class="mb-4 mt-2 flex items-center justify-between">
      <Button @click="handleAddModel">
        <Plus class="mr-2 h-4 w-4" />
        {{ t('model.addModel') }}
      </Button>
      <FilterInput
        :model-value="filterText"
        @update:model-value="setFilterText"
        class="w-72!"
        :placeholder="t('model.searchPlaceholder') as string"
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
          ? (t('model.fixErrorReload') as string)
          : (t('model.noModelData') as string)
      "
    />
    <EditModelModal
      :model-provider-key="currentEditingModel?.providerKey"
      :model-params="currentEditingModel"
      :is-modal-open="isModalOpen"
      @modal-cancel="onModalCancel"
    />
  </div>
</template>
