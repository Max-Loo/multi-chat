<script setup lang="ts" generic="TData extends RowData">
/**
 * 通用数据表格组件（Vue 版 DataTable）
 * 基于 @tanstack/vue-table（v9）与 shadcn-vue table 原语构建，功能与 React 版保持一致：
 * 自定义列渲染、行 Key、加载占位与空数据占位。
 */
import { computed } from 'vue';
import { FlexRender, tableFeatures, useTable } from '@tanstack/vue-table';
import type { ColumnDef, RowData, TableFeatures } from '@tanstack/table-core';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui-vue/table';
import { cn } from '@/utils/utils';
import { useTranslation } from '@/composables/useTranslation';

const props = withDefaults(
  defineProps<{
    /** 表格列定义 */
    columns: ColumnDef<TableFeatures, TData>[];
    /** 表格数据 */
    data: TData[];
    /** 行数据的唯一标识字段名 */
    rowKey?: string;
    /** 是否显示加载状态 */
    loading?: boolean;
    /** 空数据时的提示文本 */
    emptyText?: string;
    /** 表格容器的类名 */
    class?: string;
  }>(),
  {
    rowKey: 'id',
    loading: false,
  },
);

const { t } = useTranslation();

// v9 需要显式注册特性；当前消费方未启用排序/筛选，仅注册核心特性
const features = tableFeatures({});

// 创建表格实例：data/columns 以 computed 传入以保持响应式
const table = useTable({
  features,
  columns: computed(() => props.columns),
  data: computed(() => props.data),
});

/** 获取行数据的唯一标识 */
const getRowKey = (row: TData, index: number): string => {
  const key = (row as Record<string, unknown>)[props.rowKey];
  return key ? String(key) : `${props.rowKey}-${index}`;
};

/** 加载/空占位单元格需要跨越的列数 */
const colSpan = computed(() => props.columns.length);

/** 最终展示的空数据文本 */
const finalEmptyText = computed(() => props.emptyText || (t('table.emptyData') as string));
</script>

<template>
  <div :class="cn('rounded-md border', props.class)">
    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <FlexRender v-if="!header.isPlaceholder" :header="header" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="props.loading">
          <TableCell :colspan="colSpan" class="h-24 text-center">
            {{ t('table.loading') }}
          </TableCell>
        </TableRow>
        <template v-else-if="table.getRowModel().rows.length">
          <TableRow v-for="row in table.getRowModel().rows" :key="getRowKey(row.original, row.index)">
            <TableCell v-for="cell in row.getAllCells()" :key="cell.id">
              <FlexRender :cell="cell" />
            </TableCell>
          </TableRow>
        </template>
        <TableRow v-else>
          <TableCell :colspan="colSpan" class="h-24 text-center">
            {{ finalEmptyText }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
