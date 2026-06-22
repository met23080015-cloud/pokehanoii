import { cookies } from "next/headers";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import { LogoMark } from "@/components/brand/Logo";
import { dict } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const lang = (await cookies()).get("lang")?.value === "en" ? "en" : "vi";
  const tAdmin = dict[lang].admin as Record<string, string>;
  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand-700">
        <LogoMark className="h-7 w-7 text-brand-600" />
        {tAdmin.titleOrders}
      </h1>
      <AdminAuthGate />
    </main>
  );
}
