import { useNavigate, useLocation } from "react-router-dom";
import { useResponsive } from "@/hooks/useResponsive";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { NAVIGATION_ITEMS } from "@/config/navigation";
import { Button } from "@/components/ui/button";

interface NavItem {
  path: string;
  name: string;
  IconComponent: React.ComponentType<{ className?: string }>;
  id: "chat" | "model" | "setting";
  baseClassName: string;
  activeClassName: string;
  inactiveClassName: string;
}

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();

  const navItems = useMemo<NavItem[]>(
    () =>
      NAVIGATION_ITEMS.map((item) => ({
        path: item.path,
        name: t(item.i18nKey as any),
        IconComponent: (item as any).IconComponent,
        id: item.id,
        baseClassName: item.theme.base,
        activeClassName: item.theme.active,
        inactiveClassName: item.theme.inactive,
      })),
    [t],
  );

  // 方案A：仅在 Mobile 模式下显示底部导航栏
  if (!isMobile) {
    return null;
  }

  return (
    <nav className="border-t bg-background h-16 fixed bottom-0 left-0 w-full z-50">
      <div className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.IconComponent;
          const isActive =
            location.pathname.startsWith(item.path) && item.path !== "/";

          return (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full rounded-none",
                item.baseClassName,
                isActive ? item.activeClassName : item.inactiveClassName,
              )}
              title={item.name}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
