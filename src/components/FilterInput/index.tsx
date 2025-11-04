import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

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
  placeholder = '搜索',
  className,
  autoFocus = false,
}) => {
  return (
    <Input
      placeholder={placeholder}
      prefix={<SearchOutlined />}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      allowClear
      style={{ width: 300 }}
      className={className}
      autoFocus={autoFocus}
    />
  );
};

export default FilterInput;