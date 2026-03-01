import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * 通用数据表格组件
 * 基于 @tanstack/react-table 和 shadcn/ui table 组件构建
 *
 * @template TData - 表格数据类型
 * @template TValue - 单元格值类型
 */
interface DataTableProps<TData, TValue> {
  /**
   * 表格列定义
   */
  columns: ColumnDef<TData, TValue>[];
  /**
   * 表格数据
   */
  data: TData[];
  /**
   * 行数据的唯一标识字段名
   * @default 'id'
   */
  rowKey?: string;
  /**
   * 是否显示加载状态
   * @default false
   */
  loading?: boolean;
  /**
   * 空数据时的提示文本
   */
  emptyText?: string;
  /**
   * 表格容器的类名
   */
  className?: string;
  /**
   * 行的 data-testid 前缀（会在每行添加 data-testid="{prefix}-{rowKey}"）
   * @example rowTestId="model-card" 会生成 data-testid="model-card-123"
   */
  rowTestId?: string;
}

/**
 * 通用数据表格组件
 *
 * @example
 * const columns: ColumnDef<Model>[] = [
 *   {
 *     accessorKey: 'nickname',
 *     header: '昵称',
 *     cell: ({ row }) => row.getValue('nickname'),
 *   },
 * ];
 *
 * <DataTable columns={columns} data={models} rowKey="id" />
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  rowKey = 'id',
  loading = false,
  emptyText,
  className,
  rowTestId,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // 创建表格实例
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  // 获取行数据的唯一标识
  const getRowKey = (row: TData, index: number): string => {
    const key = (row as any)[rowKey];
    return key || `${rowKey}-${index}`;
  };

  const finalEmptyText = emptyText || t($ => $.table.emptyData);

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                {t($ => $.table.loading)}
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={getRowKey(row.original, row.index)}
                data-state={row.getIsSelected() && 'selected'}
                data-testid={rowTestId ? `${rowTestId}-${getRowKey(row.original, row.index)}` : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                {finalEmptyText}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
