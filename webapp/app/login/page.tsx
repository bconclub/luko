"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Wrong password.");
      return;
    }
    router.push(params.get("next") || "/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xs space-y-3">
      <h1 className="text-lg font-semibold tracking-tight">LUKO</h1>
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-lg border border-[var(--hair)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--muted)]"
      />
      {error && <p className="text-sm text-[var(--crit)]">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-[var(--ink)] px-3 py-2 text-sm font-semibold text-[var(--surface)] disabled:opacity-50"
      >
        {busy ? "…" : "Enter"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
