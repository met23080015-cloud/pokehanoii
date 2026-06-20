import OrderTracker from "@/components/order/OrderTracker";

export const dynamic = "force-dynamic";

export default async function OrderTrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="mx-auto max-w-md p-4">
      <OrderTracker token={token} />
    </main>
  );
}
