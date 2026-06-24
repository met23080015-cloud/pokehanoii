"use client";

import { useEffect, useState } from "react";
import { useBowl } from "@/lib/store/bowl";
import type { PayMethod } from "@/lib/supabase/types";
import { getItem, isHiddenByDiet, type DietFilter } from "@/lib/menu";
import { useUnavailable } from "@/lib/use-unavailable";
import { setRecent, consumePendingLoad } from "@/lib/favorites";
import { useT } from "@/lib/i18n";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import Logo from "@/components/brand/Logo";
import WelcomeScreen from "./WelcomeScreen";
import CalorieTarget from "./CalorieTarget";
import SizeSelector from "./SizeSelector";
import GroupStep from "./GroupStep";
import DietaryFilter from "./DietaryFilter";
import FavoritesBar from "./FavoritesBar";
import NutritionSidebar from "./NutritionSidebar";
import Checkout from "@/components/checkout/Checkout";
import OrderConfirmation from "@/components/checkout/OrderConfirmation";
import PaymentWaiting from "@/components/checkout/PaymentWaiting";
import ChatWidget from "@/components/ai/ChatWidget";

type View = "welcome" | "build" | "checkout" | "paying" | "confirmed";

export default function OrderBuilder() {
  const { tableNo, reset, selection, calorieTarget, setQty, loadSelection } = useBowl();
  const t = useT();
  const [view, setView] = useState<View>("welcome");
  const [diet, setDiet] = useState<DietFilter[]>([]);
  const unavailable = useUnavailable();

  // Món vừa bị 86 (hết hàng) mà khách đã chọn → bỏ chọn để không tính tiền/calo "ma".
  useEffect(() => {
    Object.keys(selection).forEach((id) => {
      if (unavailable.has(id)) setQty(id, 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unavailable]);

  // "Đặt lại" từ trang /account: nạp selection đã lưu và vào thẳng trình build
  useEffect(() => {
    const p = consumePendingLoad();
    if (p) {
      loadSelection(p.selection, p.target);
      setView("build");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const [paying, setPaying] = useState<{
    orderId: string;
    orderToken?: string;
    payCode: string;
    amount: number;
  } | null>(null);

  if (view === "welcome") {
    return <WelcomeScreen tableNo={tableNo} onStart={() => setView("build")} />;
  }

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

  if (view === "paying" && paying) {
    return (
      <main className="mx-auto max-w-md">
        <PaymentWaiting
          orderId={paying.orderId}
          orderToken={paying.orderToken}
          payCode={paying.payCode}
          amount={paying.amount}
          tableNo={tableNo}
          onDone={() => {
            setConfirmed({ id: paying.orderId, payMethod: "vietqr", token: paying.orderToken });
            setPaying(null);
            setView("confirmed");
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
          onAwaitingPayment={(info) => {
            setRecent({ selection, target: calorieTarget }); // cho "Đặt lại"
            setPaying(info);
            setView("paying");
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
            {t("welcome.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tableNo != null && (
            <button
              type="button"
              onClick={() => setView("welcome")}
              aria-label={t("welcome.changeTable")}
              title={t("welcome.changeTable")}
              className="press flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-sm font-bold text-white shadow-soft"
            >
              {t("common.table")} {tableNo}
              <span aria-hidden className="text-xs opacity-80">✎</span>
            </button>
          )}
          <LanguageToggle />
          <a
            href="/account"
            aria-label={t("common.account")}
            className="press flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-soft"
          >
            👤
          </a>
        </div>
      </header>

      <FavoritesBar />
      <CalorieTarget />
      <DietaryFilter value={diet} onChange={applyDiet} />
      <SizeSelector />
      <GroupStep step={1} groupKey="bases" mode="single" help={t("builder.helpBases")} diet={diet} unavailable={unavailable} />
      <GroupStep step={2} groupKey="proteins" mode="qty" help={t("builder.helpProteins")} diet={diet} unavailable={unavailable} />
      <GroupStep step={3} groupKey="mixins" mode="multi" help={t("builder.helpMixins")} diet={diet} unavailable={unavailable} />
      <GroupStep step={4} groupKey="sauces" mode="single" help={t("builder.helpSauces")} diet={diet} unavailable={unavailable} />
      <GroupStep step={5} groupKey="toppings" mode="multi" help={t("builder.helpToppings")} diet={diet} unavailable={unavailable} />
      <GroupStep step={6} groupKey="crisps" mode="multi" help={t("builder.helpCrisps")} diet={diet} unavailable={unavailable} />
      <GroupStep step={7} groupKey="drinks" mode="qty" help={t("builder.helpDrinks")} diet={diet} unavailable={unavailable} />

      <NutritionSidebar onCheckout={() => setView("checkout")} />
      <ChatWidget />
    </main>
  );
}
