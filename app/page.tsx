import { BowlProvider } from "@/lib/store/bowl";
import OrderBuilder from "@/components/builder/OrderBuilder";

function parseTable(raw: string | string[] | undefined): number | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  const sp = await searchParams;
  const tableNo = parseTable(sp.table);

  return (
    <BowlProvider tableNo={tableNo}>
      <OrderBuilder />
    </BowlProvider>
  );
}
