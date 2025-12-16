import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface FilterInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

// 过滤器输入组件
const FilterInput: React.FC<FilterInputProps> = ({
  value,
  onChange,
  placeholder,
  className,
  autoFocus = false,
}) => {
  const { t } = useTranslation();

  // 如果没有传入placeholder，则使用默认的国际化文本
  const finalPlaceholder = placeholder || t($ => $.common.search);

  return (
    <Input
      placeholder={finalPlaceholder}
      prefix={<SearchOutlined />}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      allowClear
      className={className}
      autoFocus={autoFocus}
    />
  );
};

export default FilterInput;