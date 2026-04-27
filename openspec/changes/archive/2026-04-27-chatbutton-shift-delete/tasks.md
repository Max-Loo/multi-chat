## 1. 状态追踪

- [x] 1.1 新增 `isShiftDown` 状态和 `isHovering` 状态（useState）
- [x] 1.2 添加 useEffect 注册 document 级别 keydown/keyup 事件监听，追踪 Shift 键状态，cleanup 时移除监听
- [x] 1.3 在 ChatButton 外层 div 添加 onMouseEnter/onMouseLeave 追踪悬停状态

## 2. 删除逻辑

- [x] 2.1 提取 `directDelete` 函数，复用 handleDelete 的核心逻辑（dispatch deleteChat + toast + clearChatIdParam），跳过 modal.warning 确认

## 3. 条件渲染

- [x] 3.1 在 `isShiftDown && isHovering` 为 true 时，替换 DropdownMenu 为红色背景白色垃圾桶图标的删除按钮
- [x] 3.2 删除按钮跟随 isNormalSize 响应式尺寸（desktop/mobile: h-8 w-8, 其他: h-7 w-7）
- [x] 3.3 删除按钮添加 aria-label 国际化提示
- [x] 3.4 删除按钮点击调用 directDelete 并 stopPropagation
