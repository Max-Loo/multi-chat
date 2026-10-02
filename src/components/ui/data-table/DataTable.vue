<script setup lang="ts" generic="TData, TValue">
/**
 * 通用数据表格组件（对应旧版 data-table.tsx）
 * 基于 @tanstack/vue-table 与 Table 组件族构建
 */
import { computed, ref } from 'vue';
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  FlexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/vue-table'
import { useTranslation } from '@/composables/useTranslation';
import { cn } from '@/utils/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/**
 * 表格属性
 */
interface Props {
  /** 表格列定义 */
  columns: ColumnDef<TData, TValue>[];
  /** 表格数据 */
  data: TData[];
  /** 行数据的唯一标识字段名 */
  rowKey?: string;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 空数据时的提示文本 */
  emptyText?: string;
  /** 表格容器的类名 */
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  loading: false,
  emptyText: undefined,
});

const { t } = useTranslation();

// 排序与筛选状态
const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);

// 创建表格实例
const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: (updater) => {
    sorting.value =
      typeof updater === 'function' ? updater(sorting.value) : updater;
  },
  onColumnFiltersChange: (updater) => {
    columnFilters.value =
      typeof updater === 'function' ? updater(columnFilters.value) : updater;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
  },
});

/**
 * 获取行数据的唯一标识
 */
const getRowKey = (row: TData, index: number): string => {
  const key = (row as Record<string, unknown>)[props.rowKey];
  return (key as string) || `${props.rowKey}-${index}`;
};

// 最终空数据提示文本
const finalEmptyText = computed(() => props.emptyText || t('table.emptyData'));

const containerClasses = computed(() => cn('rounded-md border', props.class));
</script>

<template>
  <div :class="containerClasses">
    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="loading">
          <TableCell :colspan="columns.length" class="h-24 text-center">
            {{ t('table.loading') }}
          </TableCell>
        </TableRow>
        <template v-else-if="table.getRowModel().rows?.length">
          <TableRow
            v-for="row in table.getRowModel().rows"
            :key="getRowKey(row.original, row.index)"
            :data-state="row.getIsSelected() ? 'selected' : undefined"
          >
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </TableCell>
          </TableRow>
        </template>
        <TableRow v-else>
          <TableCell :colspan="columns.length" class="h-24 text-center">
            {{ finalEmptyText }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
