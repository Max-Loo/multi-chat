/**
 * 表单字段上下文类型（对应旧版 form.tsx 的上下文定义）
 */
import { inject, provide, type InjectionKey } from 'vue';

/**
 * 表单上下文值
 * 使用 any 简化类型定义，避免 TanStack Form 复杂的泛型参数
 */
export interface FormContextValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

/**
 * 表单字段上下文值
 */
export interface FormFieldContextValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldState: any;
  id: string;
}

/**
 * 表单项上下文值
 */
export interface FormItemContextValue {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldState?: any;
}

/** 上下文注入键 */
export const FORM_KEY: InjectionKey<FormContextValue> = Symbol('form');
export const FORM_FIELD_KEY: InjectionKey<FormFieldContextValue> = Symbol('form-field');
export const FORM_ITEM_KEY: InjectionKey<FormItemContextValue> = Symbol('form-item');

/**
 * 获取字段状态信息（对应旧版 useFormField）
 * 支持两种使用方式：
 * 1. 通过 <FormField> 组件包装
 * 2. 直接在 form.Field 插槽中，将 field 传递给 FormItem
 */
export function useFormField() {
  const fieldContext = inject(FORM_FIELD_KEY, null);
  const itemContext = inject(FORM_ITEM_KEY, null);

  if (!itemContext) {
    throw new Error('useFormField should be used within <FormItem>');
  }

  // 从 FormFieldContext 或 FormItemContext 中获取 fieldState
  const fieldState = fieldContext?.fieldState || itemContext.fieldState;

  if (!fieldState) {
    throw new Error('useFormField should be used within <FormField> or FormItem should receive a field prop');
  }

  const { id } = itemContext;
  // TanStack Form 的错误是数组形式，取第一个错误
  const errors = fieldState.state.meta.errors;
  // Zod 返回的错误对象可能是 { message: string } 或字符串
  const error =
    errors && errors.length > 0
      ? typeof errors[0] === 'string'
        ? errors[0]
        : errors[0]?.message
      : undefined;

  return {
    id,
    name: fieldState.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error,
  };
}

/** provide 辅助：在 FormItem 中提供上下文 */
export function provideFormItemContext(value: FormItemContextValue) {
  provide(FORM_ITEM_KEY, value);
}
