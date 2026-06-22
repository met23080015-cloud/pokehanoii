import { cookies } from "next/headers";
import AccountPanel from "@/components/account/AccountPanel";
import { LogoMark } from "@/components/brand/Logo";
import { dict } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const lang = (await cookies()).get("lang")?.value === "en" ? "en" : "vi";
  const title =
    ((dict[lang].account as Record<string, string>)?.pageTitle as string) ?? "Tài khoản";
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand-700">
        <LogoMark className="h-7 w-7 text-brand-600" />
        {title}
      </h1>
      <AccountPanel />
    </main>
  );
}
