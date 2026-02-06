import React, { useCallback, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { deleteModel } from '@/store/slices/modelSlice';
import type { Model } from '@/types/model';
import { useNavigate } from 'react-router-dom';
import FilterInput from '@/components/FilterInput';
import EditModelModal from './components/EditModelModal';
import { useBasicModelTable } from '@/hooks/useBasicModelTable';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// 模型表格主组件
const ModelTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.models.loading);
  const error = useAppSelector((state) => state.models.error);
  const initializationError = useAppSelector((state) => state.models.initializationError);
  const { t } = useTranslation()

  const navigate = useNavigate()

  // 处理删除模型
  const handleDeleteModel = useCallback((model: Model): void => {
    try {
      dispatch(deleteModel({ model }));
      toast.success(t($ => $.model.deleteModelSuccess));
      setDeleteConfirmOpen(false);
    } catch {
      toast.error(t($ => $.model.deleteModelFailed));
    }
  }, [dispatch, t]);

  // 处理添加模型按钮点击
  const handleAddModel = () => {
    // 跳转到添加模型页面
    navigate('/model/add') // 使用相对路径跳转
  };

  // 当前点击需要编辑的模型
  const [currentEditingModel, setCurrentEditingModel] = useState<Model>()
  // 控制编辑模型弹窗的开关
  const [isModalOpen, setIsModalOpen] = useState(false)
  // 控制删除确认弹窗的开关
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  // 当前需要删除的模型
  const [modelToDelete, setModelToDelete] = useState<Model>()
  // 处理点击编辑模型按钮
  const handleEditModel = useCallback((value: Model) => {
    setCurrentEditingModel(value)
    setIsModalOpen(true)
  }, [setCurrentEditingModel, setIsModalOpen])

  // 关闭编辑模型弹窗的回调
  const onModalCancel = () => {
    setIsModalOpen(false)
  }

  // 一些基础的和模型列表相关的封装逻辑
  const {
    tableColumns,
    filterText,
    filteredModels,
    setFilterText,
  } = useBasicModelTable()

  // 表格列定义（包含操作列）
  const columns = React.useMemo(() => [
    ...tableColumns,
    {
      id: 'actions',
      header: t($ => $.table.operation),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditModel(row.original)}
          >
            <Pencil />
          </Button>
          <Popover open={deleteConfirmOpen && modelToDelete?.id === row.original.id} onOpenChange={setDeleteConfirmOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModelToDelete(row.original)}
              >
                <Trash2 />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <p className="font-medium">{t($ => $.model.confirmDelete)}</p>
                <p className="text-sm text-muted-foreground">
                  {t($ => $.model.confirmDeleteDescription, { nickname: row.original.nickname })}
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
                    {t($ => $.common.cancel)}
                  </Button>
                  <Button variant="destructive" size="sm" className="text-white" onClick={() => handleDeleteModel(row.original)}>
                    {t($ => $.common.confirm)}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ),
    },
  ], [handleEditModel, handleDeleteModel, tableColumns, t, deleteConfirmOpen, modelToDelete])

  return (
    <div className="p-6">
      {/* 显示初始化错误 */}
      {initializationError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>{t($ => $.model.dataLoadFailed)}</AlertTitle>
          <AlertDescription>{initializationError}</AlertDescription>
        </Alert>
      )}

      {/* 显示操作错误 */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>{t($ => $.model.operationFailed)}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 表格头部：添加按钮和过滤器 */}
      <div className="flex items-center justify-between mt-2 mb-4">
        <Button
          onClick={handleAddModel}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t($ => $.model.addModel)}
        </Button>
        <FilterInput
          value={filterText}
          onChange={setFilterText}
          className='w-72!'
          placeholder={t($ => $.model.searchPlaceholder)}
        />
      </div>

      {/* 模型数据表格 */}
      <DataTable
        columns={columns}
        data={filteredModels}
        rowKey="id"
        loading={loading}
        emptyText={initializationError
          ? t($ => $.model.fixErrorReload)
          : t($ => $.model.noModelData)}
      />
      <EditModelModal
        modelProviderKey={currentEditingModel?.providerKey}
        modelParams={currentEditingModel}
        isModalOpen={isModalOpen}
        onModalCancel={onModalCancel}
      />
    </div>
  );
};

export default ModelTable;