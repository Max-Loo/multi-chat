import FilterInput from "@/components/FilterInput"
import { LeftOutlined, MenuFoldOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import { Button } from "antd"
import { isString } from "es-toolkit";
import { JSX, useMemo, useState } from "react"

interface ToolsBarProps {
  // 传入的是字符串的时候才能启用搜索按钮
  filterText?: string;
  onFilterChange?: (value: string) => void;
  // 点击创建新会话
  onClickCreateChat?: () => void
}

const ToolsBar: React.FC<ToolsBarProps> = ({
  filterText,
  onFilterChange = () => {},
  onClickCreateChat = () => {},
}) => {
  // 是否展示搜索状态
  const [isSearching, setIsSearching] = useState(false)

  // 需要渲染的内容
  const nodeContent: JSX.Element = useMemo(() => {
    // 点击返回退出搜索
    const quitSearch = () => {
      setIsSearching(false)
      // 重置搜索的关键字
      onFilterChange('')
    }

    if (isSearching) {
      // 当开启搜索的时候，变更渲染内容
      return <>
        <Button
          className="rounded-lg! p-1!"
          icon={<LeftOutlined />}
          onClick={quitSearch}
        />
        <FilterInput
          value={filterText || ''}
          onChange={(value) => {
            onFilterChange(value)
          }}
          className="ml-2"
          autoFocus
        />
      </>
    }

    return <>
      <Button className="rounded-lg! pr-5! pl-5!" icon={<MenuFoldOutlined />} />
      <div>
        {/* 传入一个正常的字符串才表示启用搜索按钮 */}
        {isString(filterText) && <Button
          className="rounded-lg!"
          icon={<SearchOutlined />}
          onClick={() => setIsSearching(true)}
        />}
        <Button
          className="rounded-lg! ml-1"
          icon={<PlusOutlined />}
          onClick={onClickCreateChat}
        />
      </div>
    </>
  }, [isSearching, filterText, onFilterChange, setIsSearching, onClickCreateChat])

  return (
    <div className="flex items-center justify-between w-full">
      {nodeContent}
    </div>
  )
}

export default ToolsBar