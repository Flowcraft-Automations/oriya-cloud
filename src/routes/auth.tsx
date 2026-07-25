import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "התחברות · Oriya OS" },
      { name: "description", content: "התחברות למערכת Oriya OS" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fn =
        mode === "signin"
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: window.location.origin },
            });
      const { error } = await fn;
      if (error) throw error;
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-app)" }}
      dir="rtl"
    >
      <div
        className="w-full max-w-sm rounded-2xl border bg-white p-8 card-shadow"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--navy-900)" }}>
            Oriya OS
          </div>
          <div className="mx-auto mt-1 h-px w-10" style={{ backgroundColor: "var(--gold-600)" }} />
          <div className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            {mode === "signin" ? "התחברות למערכת" : "יצירת חשבון חדש"}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              אימייל
            </label>
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              סיסמה
            </label>
            <input
              type="password"
              required
              minLength={6}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ borderColor: "var(--border)" }}
            />
          </div>

          {error && (
            <div className="rounded-md border px-3 py-2 text-xs" style={{ borderColor: "var(--danger-200, #fecaca)", color: "#b91c1c" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--navy-900)" }}
          >
            {loading ? "…" : mode === "signin" ? "התחבר" : "צור חשבון"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          {mode === "signin" ? "אין חשבון? צור חדש" : "יש חשבון? התחבר"}
        </button>
      </div>
    </div>
  );
}