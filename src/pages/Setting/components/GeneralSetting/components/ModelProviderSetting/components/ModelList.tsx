import React from 'react';
import type { ModelDetail } from '@/services/modelRemoteService';
import { Badge } from '@/components/ui/badge';

/**
 * ModelList 组件的属性
 */
interface ModelListProps {
  /** 模型列表 */
  models: ModelDetail[];
}

/**
 * 模型列表组件
 * 使用标签云形式展示所有模型
 */
export const ModelList = React.memo<ModelListProps>(({ models }) => {
  if (models.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        没有找到匹配的模型
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {models.map((model) => (
        <Badge
          key={model.modelKey}
          variant="secondary"
          className="px-3 py-1 text-xs font-normal"
        >
          {model.modelName}
          <span className="ml-1 text-muted-foreground">({model.modelKey})</span>
        </Badge>
      ))}
    </div>
  );
});

ModelList.displayName = 'ModelList';
