import {
  BriefcaseIcon,
  CalendarIcon,
  FolderKanbanIcon,
  HomeIcon,
  LayoutListIcon,
  LibraryIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; soon?: boolean };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "היום שלי", icon: HomeIcon },
  { href: "/tasks", label: "משימות", icon: LayoutListIcon },
  { href: "/clients", label: "לקוחות", icon: BriefcaseIcon },
  { href: "/projects", label: "פרויקטים", icon: FolderKanbanIcon },
  { href: "/freelancers", label: "פרילנסרים", icon: UsersIcon },
  { href: "/catalog", label: "קטלוג", icon: LibraryIcon },
  { href: "/calendar", label: "יומן", icon: CalendarIcon },
  { href: "/settings", label: "הגדרות", icon: SettingsIcon },
];
