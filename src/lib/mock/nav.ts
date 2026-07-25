import {
  LayoutDashboard,
  CalendarDays,
  BookMarked,
  Sparkles,
  ClipboardList,
  Building2,
  Users,
  Handshake,
  Star,
  Wallet,
  Receipt,
  Tags,
  TicketPercent,
  FileText,
  Megaphone,
  Route,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    label: "תפעול",
    items: [
      { to: "/", label: "דשבורד", icon: LayoutDashboard },
      { to: "/calendar", label: "יומן", icon: CalendarDays },
      { to: "/reservations", label: "הזמנות", icon: BookMarked },
      { to: "/leads", label: "לידים", icon: Sparkles },
      { to: "/tasks", label: "משימות וניקיון", icon: ClipboardList },
    ],
  },
  {
    label: "פורטפוליו",
    items: [
      { to: "/properties", label: "נכסים", icon: Building2 },
      { to: "/customers", label: "לקוחות", icon: Users },
      { to: "/agents", label: "סוכנים", icon: Handshake },
      { to: "/reviews", label: "ביקורות", icon: Star },
    ],
  },
  {
    label: "כספים",
    items: [
      { to: "/payments", label: "תשלומים", icon: Wallet },
      { to: "/expenses", label: "הוצאות", icon: Receipt },
      { to: "/pricing", label: "מחירונים", icon: Tags },
      { to: "/coupons", label: "קודי קופון", icon: TicketPercent },
      { to: "/cancellation-policy", label: "מדיניות ביטול", icon: FileText },
    ],
  },
  {
    label: "שיווק",
    items: [
      { to: "/campaigns", label: "קמפיינים", icon: Megaphone },
      { to: "/journeys", label: "מסעות לקוח", icon: Route },
      { to: "/marketing-stats", label: "סטטיסטיקות שיווק", icon: BarChart3 },
    ],
  },
];