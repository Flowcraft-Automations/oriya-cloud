import {
  LayoutDashboard,
  CalendarDays,
  BookMarked,
  Building2,
  Users,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    label: "ניהול",
    items: [
      { to: "/", label: "דשבורד", icon: LayoutDashboard },
      { to: "/calendar", label: "יומן", icon: CalendarDays },
      { to: "/reservations", label: "הזמנות", icon: BookMarked },
    ],
  },
  {
    label: "פורטפוליו",
    items: [
      { to: "/properties", label: "נכסים ומחירונים", icon: Building2 },
    ],
  },
  {
    label: "קהל",
    items: [
      { to: "/leads", label: "לידים ושיווק", icon: Sparkles },
      { to: "/customers", label: "לקוחות", icon: Users },
    ],
  },
];