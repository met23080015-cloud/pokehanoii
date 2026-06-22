"use client";

import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Đơn hàng" },
  { href: "/admin/kitchen", label: "Bếp" },
  { href: "/admin/menu", label: "Thực đơn" },
  { href: "/admin/inventory", label: "Tồn kho" },
  { href: "/admin/analytics", label: "Thống kê" },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 rounded-full bg-white p-1 shadow-soft">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <a
            key={l.href}
            href={l.href}
            className={`press rounded-full px-3 py-1.5 text-sm font-semibold ${
              active ? "bg-brand-600 text-white" : "text-ink/55 hover:bg-brand-50"
            }`}
          >
            {l.label}
          </a>
        );
      })}
    </nav>
  );
}
