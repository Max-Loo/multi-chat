import { useDebouncedFilter } from "@/components/FilterInput/hooks/useDebouncedFilter"
import FilterInput from "@/components/FilterInput"
import { useNavigate } from "react-router-dom"
import { ModelProviderKeyEnum } from "@/utils/enums"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { useState } from "react"
import { useSelector } from "react-redux"
import { useTranslation } from "react-i18next"
import { RootState } from "@/store"

interface ModelSidebarProps {
  // 当前选中的大模型
  value: ModelProviderKeyEnum
  onChange: (value: ModelProviderKeyEnum) => void
}

const ModelSidebar: React.FC<ModelSidebarProps> = ({
  value: selectedModelKey,
  onChange,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // 从 Redux store 获取所有供应商
  const providers = useSelector((state: RootState) => state.modelProvider.providers)

  // 本地状态：过滤文本
  const [filterText, setFilterText] = useState<string>('')
  const {
    filteredList: filteredProviders,
  } = useDebouncedFilter(
    filterText,
    providers,
    (provider) => provider.providerName.toLocaleLowerCase().includes(filterText.toLocaleLowerCase()),
  )

  return (
    <div className="flex flex-col items-center justify-start h-full w-60">
      {/* 表头部分 */}
      <div className="p-2 border-b border-gray-300">
        <div className="flex items-center justify-between w-full pb-2">
          <Button
            variant="ghost"
            className="rounded-lg h-8 w-8 p-0"
            onClick={() => navigate('/model/table')}
          >
            <ArrowLeft size={16} />
          </Button>
          <span className="text-lg">{t($ => $.model.modelProvider)}</span>
        </div>
        <FilterInput
          value={filterText}
          onChange={setFilterText}
          placeholder={t($ => $.model.searchModel)}
          className={`w-full rounded-lg`}
        />
      </div>
      {/* 可供选择的 */}
      <div className="pb-2 w-full">
        {filteredProviders.map(provider => {
          return (
            <Button
              key={provider.providerKey}
              variant="ghost"
              className={`w-full py-5 flex justify-start rounded-none ${
                provider.providerKey === selectedModelKey && 'bg-gray-200'
              }`}
              title={provider.providerName}
              onClick={() => onChange(provider.providerKey as ModelProviderKeyEnum)}
            >
              <Avatar className="h-8 w-8">
                <img src={`https://models.dev/logos/${provider.providerKey}.svg`} alt={provider.providerName} />
              </Avatar>
              <span className="pl-2 text-base">{provider.providerName}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export default ModelSidebar