"use client";

import { useState } from "react";
import { useBowl } from "@/lib/store/bowl";
import type { PayMethod } from "@/lib/supabase/types";
import { getItem, isHiddenByDiet, type DietFilter } from "@/lib/menu";
import { setRecent } from "@/lib/favorites";
import Logo from "@/components/brand/Logo";
import CalorieTarget from "./CalorieTarget";
import GroupStep from "./GroupStep";
import DietaryFilter from "./DietaryFilter";
import FavoritesBar from "./FavoritesBar";
import NutritionSidebar from "./NutritionSidebar";
import Checkout from "@/components/checkout/Checkout";
import OrderConfirmation from "@/components/checkout/OrderConfirmation";
import ChatWidget from "@/components/ai/ChatWidget";

type View = "build" | "checkout" | "confirmed";

export default function OrderBuilder() {
  const { tableNo, reset, selection, calorieTarget, setQty } = useBowl();
  const [view, setView] = useState<View>("build");
  const [diet, setDiet] = useState<DietFilter[]>([]);

  // Khi bật filter: bỏ chọn các món bị ẩn (tránh "ghost item" vẫn tính tiền/calo)
  function applyDiet(next: DietFilter[]) {
    Object.keys(selection).forEach((id) => {
      const it = getItem(id);
      if (it && isHiddenByDiet(it, next)) setQty(id, 0);
    });
    setDiet(next);
  }
  const [confirmed, setConfirmed] = useState<{
    id: string;
    payMethod: PayMethod;
    token?: string;
  } | null>(null);

  if (view === "confirmed" && confirmed) {
    return (
      <main className="mx-auto max-w-md p-4">
        <OrderConfirmation
          orderId={confirmed.id}
          orderToken={confirmed.token}
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
          onConfirmed={(id, payMethod, token) => {
            setRecent({ selection, target: calorieTarget }); // cho "Đặt lại"
            setConfirmed({ id, payMethod, token });
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

      <FavoritesBar />
      <CalorieTarget />
      <DietaryFilter value={diet} onChange={applyDiet} />
      <GroupStep step={1} groupKey="bases" mode="single" help="Chọn 1 lớp nền." diet={diet} />
      <GroupStep step={2} groupKey="proteins" mode="qty" help="Thêm số muỗng đạm (phần đầu đã gồm trong giá)." diet={diet} />
      <GroupStep step={3} groupKey="mixins" mode="multi" help="Đồ trộn kèm (tùy chọn)." diet={diet} />
      <GroupStep step={4} groupKey="sauces" mode="single" help="Chọn 1 loại sốt." diet={diet} />
      <GroupStep step={5} groupKey="toppings" mode="multi" help="Chọn rau củ ăn kèm." diet={diet} />
      <GroupStep step={6} groupKey="crisps" mode="multi" help="Rắc thêm đồ giòn." diet={diet} />

      <NutritionSidebar onCheckout={() => setView("checkout")} />
      <ChatWidget />
    </main>
  );
}
