import { ReactNode } from "react";

export type NavigationItem = {
  id: string;
  name: string;
  icon: ReactNode;
  path: string;
  color: string;
};

export type NavigationItems = NavigationItem[];