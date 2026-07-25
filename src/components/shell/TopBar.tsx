import { Bell, Search, Languages } from "lucide-react";

export function TopBar() {
  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="relative w-full max-w-xl">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          style={{ color: "var(--text-secondary)" }}
        />
        <input
          type="search"
          placeholder="חיפוש לקוח, טלפון, הזמנה…"
          className="w-full rounded-[10px] border-0 py-2.5 pr-9 pl-3 text-sm outline-none focus:ring-2"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}
        />
      </div>

      <div className="ms-auto flex items-center gap-3">
        <button className="relative rounded-lg p-2 hover:bg-[var(--bg-subtle)]" aria-label="התראות">
          <Bell size={18} style={{ color: "var(--text-secondary)" }} />
          <span
            className="absolute top-1.5 left-1.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--gold-600)" }}
          />
        </button>
        <button
          className="flex items-center gap-1 rounded-lg p-2 text-xs hover:bg-[var(--bg-subtle)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <Languages size={16} />
          <span>עב</span>
        </button>
        <div className="mx-1 h-8 w-px" style={{ backgroundColor: "var(--border)" }} />
        <div className="flex items-center gap-2.5">
          <div className="text-right leading-tight">
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>דוד לוי</div>
            <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>מנהל מערכת</div>
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--navy-700)" }}
          >
            דל
          </div>
        </div>
      </div>
    </header>
  );
}