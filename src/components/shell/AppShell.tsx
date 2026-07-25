import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <Sidebar />
      <div className="md:mr-60">
        <TopBar />
        <main className="px-6 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}