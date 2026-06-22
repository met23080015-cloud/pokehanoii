import AdminAuthGate from "@/components/admin/AdminAuthGate";
import InventoryManager from "@/components/admin/InventoryManager";
import { LogoMark } from "@/components/brand/Logo";

export const dynamic = "force-dynamic";

export default function AdminInventoryPage() {
  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand-700">
        <LogoMark className="h-7 w-7 text-brand-600" />
        Poke Hanoi · Tồn kho
      </h1>
      <AdminAuthGate>
        <InventoryManager />
      </AdminAuthGate>
    </main>
  );
}
