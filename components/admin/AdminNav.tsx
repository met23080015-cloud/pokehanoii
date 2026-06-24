"use client";

import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import NotificationBell from "./NotificationBell";

export default function AdminNav() {
  const path = usePathname();
  const t = useT();
  const LINKS = [
    { href: "/admin", label: t("admin.navOrders") },
    { href: "/admin/kitchen", label: t("admin.navKitchen") },
    { href: "/admin/menu", label: t("admin.navMenu") },
    { href: "/admin/inventory", label: t("admin.navInventory") },
    { href: "/admin/analytics", label: t("admin.navAnalytics") },
    { href: "/admin/qr", label: t("admin.navQr") },
  ];
  return (
    <nav className="flex items-center gap-1 rounded-full bg-white p-1 shadow-soft">
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
      <LanguageToggle className="ml-1" />
      <NotificationBell />
    </nav>
  );
}
