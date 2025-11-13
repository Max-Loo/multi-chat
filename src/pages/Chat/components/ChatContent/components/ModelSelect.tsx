import FilterInput from "@/components/FilterInput"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useBasicModelTable } from "@/hooks/useBasicModelTable"
import { useCurrentSelectedChat } from "@/hooks/useCurrentSelectedChat"
import { editChat } from "@/store/slices/chatSlices"
import { Chat } from "@/types/chat"
import { Model } from "@/types/model"
import { DeleteOutlined } from "@ant-design/icons"
import { App, Button, Checkbox, Table, TableColumnsType, Tag } from "antd"
import { isUndefined } from "es-toolkit"
import { useMemo, useState } from "react"

/**
 * @description 新建聊天的时候提供选择模型
 */
const ModelSelect: React.FC = () => {
  const dispatch = useAppDispatch()
  const selectedChat = useCurrentSelectedChat()

  const typedSelectedChat = selectedChat as Chat

  const {
    message,
  } = App.useApp()

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

  // 表格相关配置
  const columns: TableColumnsType<Model> = [
    {
      title: '',
      dataIndex: 'selected',
      key: 'selected',
      render: (_, record) => (
        <Checkbox
          checked={checkedModelIdList.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              addCheckModelId(record)
            } else {
              deleteCheckModelId(record)
            }
          }} />
      ),
    },
    ...tableColumns,
  ]

  // 确认按钮的 loading 状态
  const [confirmLoading, setConfirmLoading] = useState(false)
  // 点击确定创建聊天
  const onConfirm = () => {
    if (checkedModelIdList.length <= 0) {
      message.info('请选择你想要使用的模型')
      return
    }

    setConfirmLoading(true)

    try {
      dispatch(editChat({
        chat: {
          ...typedSelectedChat,
          chatModelList: checkedModelIdList.map(id => ({
            modelId: id,
            chatHistoryList: [],
          })),
        },
      }))

      message.success('编辑聊天成功')
    } catch {
      message.error('编辑聊天失败')
    }

    setConfirmLoading(false)
  }

  return (<>
    <div className="flex justify-between w-full h-12 pl-4 pr-4">
      {/* 快速预览选中模型 */}
      <div className="flex flex-wrap items-center justify-start h-full">
        {checkedModelList.length > 0 && <Button
          color="red"
          variant="outlined"
          icon={<DeleteOutlined />}
          loading={confirmLoading}
          size="small"
          className="mr-2"
          onClick={() => {
          // 清空所有选中
            setCheckedModelIdList([])
          }}
        />}
        {checkedModelList.map(model => {
          return <Tag
            key={model.id}
            closeIcon
            color="green"
            onClose={() => deleteCheckModelId(model)}
          >
            {model.nickname}
          </Tag>
        })}
      </div>
      {/* 操作区域 */}
      <div className="flex items-center justify-end h-full">
        <Button
          type="primary"
          onClick={onConfirm}
        >
        确认
        </Button>
        <FilterInput
          value={filterText}
          onChange={setFilterText}
          placeholder='搜索昵称或备注'
          className="h-8 ml-2 w-72!"
        />
      </div>
    </div>
    {/* 模型列表 */}
    <Table
      columns={columns}
      dataSource={filteredModels}
      rowKey="id"
      loading={loading}
      pagination={false}
      className=""
    />
  </>)
}


export default ModelSelect