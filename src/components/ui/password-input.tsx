import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// 密码输入组件的属性类型，继承自原生 input 元素的所有属性
type PasswordInputProps = React.ComponentProps<"input">

/**
 * 密码输入组件
 *
 * 提供带有显示/隐藏切换按钮的密码输入框
 * - 默认隐藏密码内容（type="password"）
 * - 点击眼睛图标可切换显示/隐藏状态
 * - 支持所有标准 input 属性
 * - 完全兼容 TanStack Form
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const { t } = useTranslation()

    // 控制密码可见性状态，默认为隐藏
    const [showPassword, setShowPassword] = React.useState(false)

    // 切换密码显示/隐藏状态
    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev)
    }

    return (
      <div className="relative">
        {/* 密码输入框 */}
        <input
          type={showPassword ? "text" : "password"}
          className={cn(
            // 继承 Input 组件的基础样式
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            // 为右侧按钮预留空间
            "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />

        {/* 显示/隐藏切换按钮 */}
        <Button
          type="button"
          variant="link"
          size="icon"
          onClick={togglePasswordVisibility}
          className={cn(
            // 绝对定位，固定在输入框右侧
            "absolute right-1 top-1/2 -translate-y-1/2",
            // 按钮颜色样式（覆盖 ghost 变体的默认颜色）
            "text-muted-foreground hover:text-foreground",
            // 按钮尺寸调整（使用 h-8 w-8 以适应输入框高度 h-9）
            "h-8 w-8",
            // 禁用状态样式（继承 input 的 disabled 状态）
            props.disabled && "cursor-not-allowed opacity-50"
          )}
          aria-label={showPassword ? t($ => $.common.hide) : t($ => $.common.show)}
          disabled={props.disabled}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
      </div>
    )
  }
)

PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
