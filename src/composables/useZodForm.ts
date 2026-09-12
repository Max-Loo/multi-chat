import { reactive, type Ref } from 'vue';
import type { z } from 'zod';

/**
 * 基于 zod 的自研轻量表单组合式函数（design D5 降级方案）
 *
 * 背景：`@tanstack/vue-form` v1 处于 RC 阶段，字段级 render props 范式与 Vue 组合式 API
 * 亲和度不足，无法稳定支撑 ModelConfigForm 的字段校验需求（任务 3.10 验证结论）。
 * 按设计降级为基于 zod 的轻量实现：值收集 + 字段级即时校验 + 提交时整体校验。
 */

interface UseZodFormOptions<Values extends Record<string, unknown>> {
  /** 返回表单初始值（用于初始化与 reset） */
  defaultValues: () => Values;
}

type FieldName<Values extends Record<string, unknown>> = Extract<keyof Values, string>;

/**
 * 创建轻量表单实例
 * @param options.defaultValues 初始值工厂
 * @param schemaRef 响应式 zod schema（对象 schema，字段与 Values 一一对应）
 */
export const useZodForm = <Values extends Record<string, unknown>>(
  options: UseZodFormOptions<Values>,
  schemaRef: Ref<z.ZodObject<Record<string, z.ZodTypeAny>>>,
) => {
  // 表单值（响应式）
  const values = reactive({ ...options.defaultValues() }) as Values;

  // 字段级校验错误
  const errors = reactive<Record<string, string>>({});

  /** 校验单个字段；返回是否通过 */
  const validateField = (name: FieldName<Values>): boolean => {
    const fieldSchema = (schemaRef.value as z.ZodObject<z.ZodRawShape>).shape[name];
    if (!fieldSchema) return true;
    const result = (fieldSchema as z.ZodType).safeParse((values as Record<string, unknown>)[name]);
    if (result.success) {
      delete errors[name];
      return true;
    }
    errors[name] = result.error.issues[0]?.message ?? '';
    return false;
  };

  /** 更新字段值并即时校验（对应 迁移前 validators.onChange） */
  const handleChange = (name: FieldName<Values>, value: unknown) => {
    (values as Record<string, unknown>)[name] = value;
    validateField(name);
  };

  /**
   * 提交：整体校验通过后调用 onSubmit；失败时填充全部字段错误
   * 返回是否提交成功
   */
  const handleSubmit = async (
    onSubmit: (values: Values) => void | Promise<void>,
  ): Promise<boolean> => {
    const result = schemaRef.value.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as FieldName<Values>;
        if (field && errors[field] === undefined) {
          errors[field] = issue.message;
        }
      }
      return false;
    }
    await onSubmit(values);
    return true;
  };

  /** 还原为初始值并清空错误 */
  const reset = () => {
    Object.assign(values, options.defaultValues());
    for (const key of Object.keys(errors)) {
      delete errors[key];
    }
  };

  return {
    values,
    errors,
    validateField,
    handleChange,
    handleSubmit,
    reset,
  };
};
