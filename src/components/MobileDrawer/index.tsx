import React from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface MobileDrawerProps {
  /** 抽屉是否打开 */
  isOpen: boolean;
  /** 抽屉打开/关闭状态变化的回调 */
  onOpenChange: (open: boolean) => void;
  /** 抽屉内容 */
  children: React.ReactNode;
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
}

/**
 * 通用移动端抽屉组件
 * @description 从左侧滑出的抽屉容器，用于移动端显示侧边栏等组件
 */
export function MobileDrawer({
  isOpen,
  onOpenChange,
  children,
  showCloseButton = true,
}: MobileDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        aria-description="抽屉内容"
        side="left"
        className="w-fit max-w-[85vw] sm:max-w-md"
        showCloseButton={showCloseButton}
      >
        <SheetTitle className="sr-only">侧边栏</SheetTitle>
        <SheetDescription className="sr-only">侧边栏</SheetDescription>
        {children}
      </SheetContent>
    </Sheet>
  );
}
