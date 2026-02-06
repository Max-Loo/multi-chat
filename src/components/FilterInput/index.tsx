import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
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
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 h-4 w-4 text-gray-400" />
      <Input
        placeholder={finalPlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
        autoFocus={autoFocus}
      />
    </div>
  );
};

export default FilterInput;