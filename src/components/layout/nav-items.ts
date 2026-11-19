import {
  BriefcaseIcon,
  CalendarIcon,
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
  { href: "/freelancers", label: "פרילנסרים", icon: UsersIcon },
  { href: "/catalog", label: "קטלוג", icon: LibraryIcon, soon: true },
  { href: "/calendar", label: "יומן", icon: CalendarIcon, soon: true },
  { href: "/settings", label: "הגדרות", icon: SettingsIcon, soon: true },
];
