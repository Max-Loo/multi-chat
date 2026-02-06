import FilterInput from "@/components/FilterInput"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useBasicModelTable } from "@/hooks/useBasicModelTable"
import { useCurrentSelectedChat } from "@/hooks/useCurrentSelectedChat"
import { editChat } from "@/store/slices/chatSlices"
import { Chat } from "@/types/chat"
import { Model } from "@/types/model"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { toast } from 'sonner'
import { isUndefined } from "es-toolkit"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ColumnDef } from "@tanstack/react-table"

/**
 * @description 新建聊天的时候提供选择模型
 */
const ModelSelect: React.FC = () => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const selectedChat = useCurrentSelectedChat()

  const typedSelectedChat = selectedChat as Chat

  const {
    filterText,
    filteredModels,
    setFilterText,
    tableColumns,
  } = useBasicModelTable()

  const models = useAppSelector(state => state.models.models)
  const loading = useAppSelector(state => state.models.loading)

  // 选中的模型ID的列表
  const [checkedModelIdList, setCheckedModelIdList] = useState<string[]>([])

  // 添加选中的ID
  const addCheckModelId = (model: Model) => {
    setCheckedModelIdList([
      ...checkedModelIdList,
      model.id,
    ])
  }

  // 删除选中的ID
  const deleteCheckModelId = (model: Model) => {
    const idx = checkedModelIdList.findIndex(item => item === model.id)
    if (idx !== -1) {
      const newList = [...checkedModelIdList]
      newList.splice(idx, 1)
      setCheckedModelIdList(newList)
    }
  }

  // 从 redux 中计算出模型列表
  const checkedModelList = useMemo<Model[]>(() => {
    const list: Model[] = []
    checkedModelIdList.forEach(id => {
      const model = models.find(item => item.id === id)
      if (!isUndefined(model)) {
        list.push(model)
      }
    })
    return list
  }, [models, checkedModelIdList])

  // 表格相关配置（添加选择列）
  const columns: ColumnDef<Model>[] = [
    {
      id: 'selected',
      header: '',
      cell: ({ row }) => (
        <Checkbox
          checked={checkedModelIdList.includes(row.original.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              addCheckModelId(row.original)
            } else {
              deleteCheckModelId(row.original)
            }
          }}
        />
      ),
    },
    ...tableColumns,
  ]

  // 确认按钮的 loading 状态
  const [confirmLoading, setConfirmLoading] = useState(false)

  // 点击确定创建聊天
  const onConfirm =  async () => {
    if (checkedModelIdList.length <= 0) {
      toast.info(t($ => $.chat.selectModelHint))
      return
    }

    setConfirmLoading(true)

    try {
      await dispatch(editChat({
        chat: {
          ...typedSelectedChat,
          chatModelList: checkedModelIdList.map(id => ({
            modelId: id,
            chatHistoryList: [],
          })),
        },
      }))

      toast.success(t($ => $.chat.configureChatSuccess), {
        position: 'top-right'
      })
    } catch {
      toast.error(t($ => $.chat.configureChatFailed), {
        position: 'top-right'
      })
    }

    setConfirmLoading(false)
  }

  return (<>
    <div className="flex justify-between w-full h-12 pl-4 pr-4">
      {/* 快速预览选中模型 */}
      <div className="flex flex-wrap items-center justify-start h-full">
        {checkedModelList.length > 0 && <Button
          variant="outline"
          size="sm"
          className="mr-2"
          onClick={() => {
          // 清空所有选中
            setCheckedModelIdList([])
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>}
        {checkedModelList.map((model: Model) => {
          return <Badge
            key={model.id}
            variant="secondary"
            className="mr-1 cursor-pointer"
            onClick={() => deleteCheckModelId(model)}
          >
            {model.nickname}
            <button
              className="ml-1 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                deleteCheckModelId(model)
              }}
            >
              ×
            </button>
          </Badge>
        })}
      </div>
      {/* 操作区域 */}
      <div className="flex items-center justify-end h-full">
        <Button
          onClick={onConfirm}
          disabled={confirmLoading}
        >
          {t($ => $.common.confirm)}
        </Button>
        <FilterInput
          value={filterText}
          onChange={setFilterText}
          placeholder={t($ => $.chat.searchPlaceholder)}
          className="h-8 ml-2 w-72!"
        />
      </div>
    </div>
    {/* 模型列表 */}
    <DataTable
      columns={columns}
      data={filteredModels}
      rowKey="id"
      loading={loading}
      className="ml-1 mr-1"
    />
  </>)
}


export default ModelSelect