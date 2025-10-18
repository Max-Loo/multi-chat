import { useDebouncedFilter } from "@/components/FilterInput/hooks/useDebouncedFilter"
import FilterInput from "@/components/FilterInput"
import { useNavToPage } from "@/store/slices/modelPageSlice"
import { MODEL_PROVIDERS } from "@/utils/constants"
import { ModelProviderKeyEnum } from "@/utils/enums"
import { LeftOutlined } from "@ant-design/icons"
import { Avatar, Button } from "antd"
import { debounce } from "es-toolkit"
import { useEffect, useState } from "react"

interface ModelSidebarProps {
  // 组件创建时默认选中的大模型
  defaultValue?: ModelProviderKeyEnum
  // 当前选中的大模型
  value: ModelProviderKeyEnum
  onChange: (value: ModelProviderKeyEnum) => void
}

const ModelSidebar: React.FC<ModelSidebarProps> = ({
  value: selectedModelKey,
  onChange
}) => {
  const { navToTablePage } = useNavToPage()

  // 本地状态：过滤文本
  const [filterText, setFilterText] = useState<string>('')
  const {
    filteredList: filteredProviders
   } = useDebouncedFilter(
    filterText, 
    MODEL_PROVIDERS,
    (provider) => provider.name.toLocaleLowerCase().includes(filterText.toLocaleLowerCase()),
  )

  return (
    <div className="p-2 w-[260px] h-full border-r border-gray-200 flex flex-col justify-start items-center">
      {/* 表头部分 */}
      <div className="flex items-center justify-between w-full pb-2">
        <Button className="!rounded-lg" onClick={navToTablePage}><LeftOutlined /></Button>
        <span className="text-lg">模型服务商</span>
      </div>
      <FilterInput
        value={filterText}
        onChange={setFilterText}
        placeholder='搜索模型'
        className={`!w-full !rounded-lg`}
      />
      {/* 可供选择的 */}
      {filteredProviders.map(provider => {
        return (
          <Button
            key={provider.key}
            type="text"
            className={`!w-full mt-1.5 !py-5 flex !justify-start !rounded-xl ${
              provider.key === selectedModelKey && '!border-1 !bg-gray-100 !border-gray-300'
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
  )
}

export default ModelSidebar