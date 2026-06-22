import AdminAuthGate from "@/components/admin/AdminAuthGate";
import MenuManager from "@/components/admin/MenuManager";
import PriceConfigEditor from "@/components/admin/PriceConfigEditor";
import { LogoMark } from "@/components/brand/Logo";

export const dynamic = "force-dynamic";

export default function AdminMenuPage() {
  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand-700">
        <LogoMark className="h-7 w-7 text-brand-600" />
        Poke Hanoi · Thực đơn
      </h1>
      <AdminAuthGate>
        <div className="flex flex-col gap-4">
          <PriceConfigEditor />
          <MenuManager />
        </div>
      </AdminAuthGate>
    </main>
  );
}
