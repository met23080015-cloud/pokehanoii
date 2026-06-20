import AccountPanel from "@/components/account/AccountPanel";
import { LogoMark } from "@/components/brand/Logo";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand-700">
        <LogoMark className="h-7 w-7 text-brand-600" />
        Tài khoản
      </h1>
      <AccountPanel />
    </main>
  );
}
