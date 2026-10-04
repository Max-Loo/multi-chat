<script setup lang="ts" generic="TData, TValue">
import { ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/utils/utils';

/**
 * 通用数据表格组件属性
 */
interface DataTableProps {
  /** 行数据的唯一标识字段名 */
  rowKey?: string;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 空数据时的提示文本 */
  emptyText?: string;
  /** 表格容器的类名 */
  class?: string;
}

const props = withDefaults(defineProps<DataTableProps>(), {
  rowKey: 'id',
  loading: false,
  emptyText: undefined,
});

/** 表格列定义与数据（泛型由调用方约束） */
const columns = defineModel<ColumnDef<TData, TValue>[]>('columns', { required: true });
const data = defineModel<TData[]>('data', { required: true });

const { t } = useTranslation();

/** 排序与列过滤状态 */
const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);

// 创建表格实例
const table = useVueTable({
  get data() {
    return data.value;
  },
  get columns() {
    return columns.value;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater;
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
 * @param row 行数据
 * @param index 行索引
 */
function getRowKey(row: TData, index: number): string {
  const key = (row as Record<string, unknown>)[props.rowKey];
  return (key as string) || `${props.rowKey}-${index}`;
}

/** 空数据提示文本 */
const finalEmptyText = () => props.emptyText || t('table.emptyData');
</script>

<!--
  通用数据表格组件
  基于 @tanstack/vue-table 和 shadcn-vue table 组件构建
-->
<template>
  <div :class="cn('rounded-md border', props.class)">
    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <template v-if="!header.isPlaceholder">
              <FlexRender
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </template>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="props.loading">
          <TableCell :colspan="columns.length" class="h-24 text-center">
            {{ t('table.loading') }}
          </TableCell>
        </TableRow>
        <template v-else-if="table.getRowModel().rows.length">
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
            {{ finalEmptyText() }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
