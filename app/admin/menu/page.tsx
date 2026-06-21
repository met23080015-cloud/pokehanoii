import AdminAuthGate from "@/components/admin/AdminAuthGate";
import MenuManager from "@/components/admin/MenuManager";
import { LogoMark } from "@/components/brand/Logo";

export const dynamic = "force-dynamic";

export default function AdminMenuPage() {
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand-700">
        <LogoMark className="h-7 w-7 text-brand-600" />
        Poke Hanoi · Thực đơn
      </h1>
      <AdminAuthGate>
        <MenuManager />
      </AdminAuthGate>
    </main>
  );
}
