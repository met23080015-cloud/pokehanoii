import { BowlProvider } from "@/lib/store/bowl";
import OrderBuilder from "@/components/builder/OrderBuilder";
import { isValidTable } from "@/lib/tables";

function parseTable(raw: string | string[] | undefined): number | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = Math.floor(Number(v));
  return isValidTable(n) ? n : null; // bỏ qua bàn ngoài 1..MAX_TABLE
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
