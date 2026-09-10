"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 8,
        fontSize: 14,
        textDecoration: "none",
        color: active ? "var(--accent)" : "var(--ink-muted)",
        background: active ? "var(--accent-soft)" : "transparent",
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </Link>
  );
}
