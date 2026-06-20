"use client";

import { useState } from "react";
import { useBowl } from "@/lib/store/bowl";
import type { PayMethod } from "@/lib/supabase/types";
import Logo from "@/components/brand/Logo";
import CalorieTarget from "./CalorieTarget";
import GroupStep from "./GroupStep";
import NutritionSidebar from "./NutritionSidebar";
import Checkout from "@/components/checkout/Checkout";
import OrderConfirmation from "@/components/checkout/OrderConfirmation";
import ChatWidget from "@/components/ai/ChatWidget";

type View = "build" | "checkout" | "confirmed";

export default function OrderBuilder() {
  const { tableNo, reset } = useBowl();
  const [view, setView] = useState<View>("build");
  const [confirmed, setConfirmed] = useState<{
    id: string;
    payMethod: PayMethod;
  } | null>(null);

  if (view === "confirmed" && confirmed) {
    return (
      <main className="mx-auto max-w-md p-4">
        <OrderConfirmation
          orderId={confirmed.id}
          tableNo={tableNo}
          payMethod={confirmed.payMethod}
          onNewOrder={() => {
            reset();
            setConfirmed(null);
            setView("build");
          }}
        />
      </main>
    );
  }

  if (view === "checkout") {
    return (
      <main>
        <Checkout
          onBack={() => setView("build")}
          onConfirmed={(id, payMethod) => {
            setConfirmed({ id, payMethod });
            setView("confirmed");
          }}
        />
        <ChatWidget />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-4 pb-44">
      <header className="flex items-center justify-between pt-1">
        <div>
          <Logo />
          <p className="mt-0.5 text-xs font-medium text-ink/50">
            Tự build bát theo mục tiêu calo
          </p>
        </div>
        {tableNo != null && (
          <span className="rounded-full bg-brand-600 px-3 py-1.5 text-sm font-bold text-white shadow-soft">
            Bàn {tableNo}
          </span>
        )}
      </header>

      <CalorieTarget />
      <GroupStep step={1} groupKey="bases" mode="single" help="Chọn 1 lớp nền." />
      <GroupStep step={2} groupKey="proteins" mode="qty" help="Thêm số muỗng đạm (phần đầu đã gồm trong giá)." />
      <GroupStep step={3} groupKey="mixins" mode="multi" help="Đồ trộn kèm (tùy chọn)." />
      <GroupStep step={4} groupKey="sauces" mode="single" help="Chọn 1 loại sốt." />
      <GroupStep step={5} groupKey="toppings" mode="multi" help="Chọn rau củ ăn kèm." />
      <GroupStep step={6} groupKey="crisps" mode="multi" help="Rắc thêm đồ giòn." />

      <NutritionSidebar onCheckout={() => setView("checkout")} />
      <ChatWidget />
    </main>
  );
}
