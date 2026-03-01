/**
 * Model 管理测试 Mock 工厂
 *
 * 提供模型管理组件测试所需的 Mock 工厂函数
 */

import { vi } from 'vitest';
import type { Model } from '@/types/model';
import type { DefaultModelProviderConfig } from '@/types/model';

/**
 * 创建 Mock 模型提供商配置
 * @param overrides 要覆盖的字段
 * @returns 模型提供商配置对象
 */
export const createMockProviderConfig = (
  overrides?: Partial<DefaultModelProviderConfig>
): DefaultModelProviderConfig => {
  return {
    apiAddress: 'https://api.test.com/v1',
    modelList: [
      {
        modelName: 'Test Model 1',
        modelKey: 'test-model-1',
      },
      {
        modelName: 'Test Model 2',
        modelKey: 'test-model-2',
      },
    ],
    ...overrides,
  };
};

/**
 * 创建 Mock 表单状态
 * @param overrides 要覆盖的字段
 * @returns 表单状态对象
 */
export const createMockFormState = (overrides?: {
  nickname?: string;
  apiKey?: string;
  apiAddress?: string;
  remark?: string;
  modelKey?: string;
  isEnable?: boolean;
}) => {
  return {
    nickname: 'Test Model',
    apiKey: 'test-api-key',
    apiAddress: 'https://api.test.com/v1',
    remark: 'Test remark',
    modelKey: 'test-model-1',
    isEnable: true,
    ...overrides,
  };
};

/**
 * 创建 Mock 编辑表单状态
 * @param model 要编辑的模型
 * @returns 表单状态对象，预填充模型数据
 */
export const createMockEditFormState = (model: Model) => {
  return createMockFormState({
    nickname: model.nickname,
    apiKey: model.apiKey,
    apiAddress: model.apiAddress,
    remark: model.remark,
    modelKey: model.modelKey,
    isEnable: model.isEnable,
  });
};

/**
 * 创建 Mock TanStack Form 实例
 * @param values 表单值
 * @returns TanStack Form 的 Mock 实现
 */
export const createMockForm = (values?: Record<string, any>) => {
  const defaultValues = values || createMockFormState();

  return {
    state: {
      values: defaultValues,
      isSubmitting: false,
      isValid: true,
      errors: {},
    },
   FieldValue: vi.fn(({ name }: { name: string }) => ({
      value: defaultValues[name as keyof typeof defaultValues],
      handleChange: vi.fn(),
      handleBlur: vi.fn(),
    })),
    setFieldValue: vi.fn(),
    setFieldValues: vi.fn(),
    reset: vi.fn(),
    handleSubmit: vi.fn(),
    validate: vi.fn(async () => ({})),
  };
};

/**
 * 创建 Mock 表单验证错误
 * @param fieldErrors 字段错误对象
 * @returns 表单验证错误对象
 */
export const createMockFormErrors = (fieldErrors?: Record<string, string>) => {
  return {
    nickname: fieldErrors?.nickname || 'Nickname is required',
    apiKey: fieldErrors?.apiKey || 'API Key is required',
    apiAddress: fieldErrors?.apiAddress || 'API Address is required',
    modelKey: fieldErrors?.modelKey || 'Model is required',
    ...fieldErrors,
  };
};

/**
 * 创建 Mock 操作确认对话框状态
 * @param isOpen 是否打开
 * @returns 对话框状态对象
 */
export const createMockConfirmDialog = (isOpen = false) => {
  return {
    isOpen,
    title: isOpen ? 'Confirm Action' : '',
    description: isOpen ? 'Are you sure?' : '',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };
};

/**
 * 创建 Mock Toast 通知状态
 * @param message 消息内容
 * @param type 消息类型
 * @returns Toast 状态对象
 */
export const createMockToast = (message?: string, type: 'success' | 'error' | 'info' = 'info') => {
  return {
    message: message || '',
    type,
    visible: !!message,
    show: vi.fn(),
    hide: vi.fn(),
  };
};

/**
 * 创建 ModelTable 测试 Mock 集合
 * @param customMocks 自定义 Mock 配置
 * @returns 包含所有必需 Mock 的对象
 */
export const createModelTableMocks = (customMocks?: {
  models?: Model[];
  loading?: boolean;
  error?: string;
  initializationError?: string;
}) => {
  return {
    models: customMocks?.models || [],
    loading: customMocks?.loading || false,
    error: customMocks?.error || null,
    initializationError: customMocks?.initializationError || null,
  };
};

/**
 * 创建 ModelConfigForm 测试 Mock 集合
 * @param customMocks 自定义 Mock 配置
 * @returns 包含所有必需 Mock 的对象
 */
export const createModelConfigFormMocks = (customMocks?: {
  form?: ReturnType<typeof createMockForm>;
  providerConfig?: DefaultModelProviderConfig;
  isEditMode?: boolean;
  existingModel?: Model;
}) => {
  return {
    form: customMocks?.form || createMockForm(),
    providerConfig: customMocks?.providerConfig || createMockProviderConfig(),
    isEditMode: customMocks?.isEditMode || false,
    existingModel: customMocks?.existingModel,
  };
};
