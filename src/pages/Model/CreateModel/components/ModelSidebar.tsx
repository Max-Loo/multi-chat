import { useDebouncedFilter } from "@/components/FilterInput/hooks/useDebouncedFilter"
import FilterInput from "@/components/FilterInput"
import { useNavToPage } from "@/store/slices/modelPageSlice"
import { ModelProviderKeyEnum } from "@/utils/enums"
import { LeftOutlined } from "@ant-design/icons"
import { Avatar, Button } from "antd"
import { useState } from "react"
import { ModelProviderFactoryCreator } from "@/lib/factory/modelProviderFactory"

interface ModelSidebarProps {
  // 当前选中的大模型
  value: ModelProviderKeyEnum
  onChange: (value: ModelProviderKeyEnum) => void
}

const ModelSidebar: React.FC<ModelSidebarProps> = ({
  value: selectedModelKey,
  onChange,
}) => {
  const { navToTablePage } = useNavToPage()

  // 本地状态：过滤文本
  const [filterText, setFilterText] = useState<string>('')
  const {
    filteredList: filteredProviders,
  } = useDebouncedFilter(
    filterText,
    ModelProviderFactoryCreator.getFactoryList().map((modelProviderFactory) => modelProviderFactory.getModelProvider()),
    (provider) => provider.name.toLocaleLowerCase().includes(filterText.toLocaleLowerCase()),
  )

  return (
    <div className="flex flex-col items-center justify-start h-full w-60">
      {/* 表头部分 */}
      <div className="p-2 border-b border-gray-300">
        <div className="flex items-center justify-between w-full pb-2">
          <Button className="rounded-lg!" onClick={navToTablePage}><LeftOutlined /></Button>
          <span className="text-lg">模型服务商</span>
        </div>
        <FilterInput
          value={filterText}
          onChange={setFilterText}
          placeholder='搜索模型'
          className={`w-full! rounded-lg!`}
        />
      </div>
      {/* 可供选择的 */}
      <div className="pb-2">
        {filteredProviders.map(provider => {
          return (
            <Button
              key={provider.key}
              type="text"
              className={`w-full py-5! flex justify-start! rounded-none! ${
                provider.key === selectedModelKey && 'bg-gray-200!'
              }`}
              title={provider.name}
              onClick={() => onChange(provider.key)}
            >
              {provider.logoUrl && (
                <Avatar
                  size={30}
                  src={provider.logoUrl}
                  alt={provider.name}
                />
              )}
              <span className="pl-2 text-base">{provider.name}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export default ModelSidebar