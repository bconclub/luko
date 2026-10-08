"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/", label: "Today" },
  { href: "/projects", label: "Projects" },
  { href: "/people", label: "People" },
  { href: "/proposals", label: "Proposals" },
  { href: "/money", label: "Money" },
  { href: "/signals", label: "Signals" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="tabs">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={pathname === t.href ? "active" : ""}>
          {t.label}
        </Link>
      ))}
      <button
        onClick={logout}
        className="active"
        style={{
          marginLeft: "auto",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--muted)",
          fontSize: 13.5,
          fontWeight: 600,
          padding: "8px 14px",
        }}
      >
        Log out
      </button>
    </nav>
  );
}
