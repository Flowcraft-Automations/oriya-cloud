import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronsLeftRight } from "lucide-react";
import { navGroups } from "@/lib/mock/nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 hidden w-60 flex-col md:flex"
      style={{ backgroundColor: "var(--navy-900)", color: "var(--text-on-dark)" }}
    >
      <div className="px-5 pt-5 pb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-white">Oriya OS</span>
          <span className="text-xs" style={{ color: "var(--text-on-dark-muted)" }}>
            מערכת ניהול
          </span>
        </div>
        <div className="mt-1 h-px w-8" style={{ backgroundColor: "var(--gold-600)" }} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <div
              className="mb-2 px-3 text-[11px] font-semibold uppercase"
              style={{ color: "var(--text-on-dark-muted)", letterSpacing: "0.08em" }}
            >
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.to === "/"
                    ? pathname === "/"
                    : pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <li key={item.to} className="relative">
                    {active && (
                      <span
                        className="absolute inset-y-1.5 right-0 w-[3px] rounded-l"
                        style={{ backgroundColor: "var(--gold-600)" }}
                      />
                    )}
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors",
                        active ? "text-white" : "hover:bg-white/5",
                      )}
                      style={{
                        backgroundColor: active ? "var(--navy-800)" : undefined,
                        color: active ? "#fff" : "var(--text-on-dark)",
                      }}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className="flex items-center justify-between border-t px-4 py-3 text-xs"
        style={{ borderColor: "var(--navy-800)", color: "var(--text-on-dark-muted)" }}
      >
        <span>v0.1 · Preview</span>
        <button className="rounded p-1 hover:bg-white/5" aria-label="כווץ תפריט">
          <ChevronsLeftRight size={14} />
        </button>
      </div>
    </aside>
  );
}