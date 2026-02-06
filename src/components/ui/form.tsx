"use client"

/* eslint-disable react/no-children-prop */
// TanStack Form 使用 render props 模式，需要使用 children prop

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * 表单上下文值的类型定义
 * 使用 any 简化类型定义，避免 TanStack Form 复杂的泛型参数
 */
type FormContextValue = {
  form: any
}

// 创建表单上下文
const FormContext = React.createContext<FormContextValue | null>(null)

/**
 * Form 组件 - 用于包装表单并提供上下文
 * @param form - TanStack Form 实例
 * @param children - 子组件
 */
const Form = ({
  form,
  children,
}: {
  form: any
  children: React.ReactNode
}) => {
  return (
    <FormContext.Provider value={{ form }}>{children}</FormContext.Provider>
  )
}

/**
 * FormField 上下文值的类型定义
 */
type FormFieldContextValue = {
  fieldState: any
  id: string
}

// 创建 FormField 上下文
const FormFieldContext = React.createContext<FormFieldContextValue | null>(
  null,
)

/**
 * FormItem 上下文值的类型定义
 */
type FormItemContextValue = {
  id: string
  fieldState?: any
}

// 创建 FormItem 上下文
const FormItemContext = React.createContext<FormItemContextValue | null>(null)

/**
 * FormField 组件 - 包装 TanStack Form 的 Field 组件
 * @param name - 字段名称
 * @param children - 渲染函数，接收字段实例
 */
const FormField = ({
  name,
  children,
}: {
  name: string
  children: (field: any) => React.ReactNode
}) => {
  const { form } = React.useContext(FormContext)!

  return (
    <form.Field
      name={name}
      children={(field: any) => (
        <FormFieldContext.Provider value={{ fieldState: field, id: field.name }}>
          {children(field)}
        </FormFieldContext.Provider>
      )}
    />
  )
}

/**
 * useFormField Hook - 获取字段状态信息
 * 用于在 FormItem、FormLabel、FormControl 等组件中访问字段状态
 * 支持两种使用方式：
 * 1. 通过 <FormField> 组件包装
 * 2. 直接在 form.Field 的 children 函数中，将 field 传递给 FormItem
 * @returns 字段状态相关的 ID 和错误信息
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)

  if (!itemContext) {
    throw new Error("useFormField should be used within <FormItem>")
  }

  // 从 FormFieldContext 或 FormItemContext 中获取 fieldState
  const fieldState = fieldContext?.fieldState || itemContext.fieldState

  if (!fieldState) {
    throw new Error("useFormField should be used within <FormField> or FormItem should receive a field prop")
  }

  const { id } = itemContext
  // TanStack Form 的错误是数组形式，取第一个错误
  const errors = fieldState.state.meta.errors
  // Zod 返回的错误对象可能是 { message: string } 或字符串
  const error = errors && errors.length > 0 
    ? (typeof errors[0] === 'string' ? errors[0] : errors[0]?.message) 
    : undefined

  return {
    id,
    name: fieldState.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error,
  }
}

/**
 * FormItem 组件 - 表单项容器
 * 提供唯一的 ID 用于关联 Label、Input 和 Message
 * @param field - 可选的字段实例，当直接使用 form.Field 时需要传递
 */
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { field?: any }
>(({ className, field, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id, fieldState: field }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

/**
 * FormLabel 组件 - 表单标签
 * 根据错误状态自动应用红色样式
 */
const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

/**
 * FormControl 组件 - 表单控件包装器
 * 自动设置 aria 属性用于无障碍访问
 */
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

/**
 * FormDescription 组件 - 表单描述文本
 * 用于显示字段提示信息
 */
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

/**
 * FormMessage 组件 - 表单错误消息显示
 * 自动显示验证错误或自定义消息
 */
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error || children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
