"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { groups, type GroupKey } from "@/lib/menu";
import {
  computeTotals,
  type BowlSize,
  type PriceConfig,
  type Selection,
  type Totals,
} from "@/lib/nutrition";
import { useMenuConfig } from "@/lib/use-menu-config";

interface BowlState {
  tableNo: number | null;
  calorieTarget: number;
  selection: Selection;
  size: BowlSize;
}

type Action =
  | { type: "setTarget"; value: number }
  | { type: "setTable"; value: number }
  | { type: "setSize"; value: BowlSize }
  | { type: "setQty"; id: string; qty: number }
  | { type: "toggle"; id: string }
  | { type: "selectSingle"; group: GroupKey; id: string }
  | { type: "loadSelection"; selection: Selection; target?: number }
  | { type: "reset" };

function reducer(state: BowlState, action: Action): BowlState {
  switch (action.type) {
    case "setTarget":
      return { ...state, calorieTarget: action.value };
    case "setTable":
      return { ...state, tableNo: action.value };
    case "setSize":
      return { ...state, size: action.value };
    case "setQty": {
      const selection = { ...state.selection, [action.id]: action.qty };
      if (action.qty <= 0) delete selection[action.id];
      return { ...state, selection };
    }
    case "toggle": {
      const cur = state.selection[action.id] || 0;
      const selection = { ...state.selection };
      if (cur > 0) delete selection[action.id];
      else selection[action.id] = 1;
      return { ...state, selection };
    }
    case "selectSingle": {
      const selection = { ...state.selection };
      groups[action.group].forEach((it) => delete selection[it.id]);
      selection[action.id] = 1;
      return { ...state, selection };
    }
    case "loadSelection":
      return {
        ...state,
        selection: { ...action.selection },
        calorieTarget: action.target ?? state.calorieTarget,
      };
    case "reset":
      return { ...state, selection: {}, size: "regular", calorieTarget: state.calorieTarget };
    default:
      return state;
  }
}

interface BowlContextValue extends BowlState {
  totals: Totals;
  config: PriceConfig | undefined;
  setTarget: (v: number) => void;
  setTable: (v: number) => void;
  setSize: (v: BowlSize) => void;
  setQty: (id: string, qty: number) => void;
  toggle: (id: string) => void;
  selectSingle: (group: GroupKey, id: string) => void;
  loadSelection: (selection: Selection, target?: number) => void;
  reset: () => void;
}

const BowlContext = createContext<BowlContextValue | null>(null);

export function BowlProvider({
  tableNo,
  children,
}: {
  tableNo: number | null;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, {
    tableNo,
    calorieTarget: 1000,
    selection: {},
    size: "regular",
  });

  // Đồng bộ tableNo từ URL (?table=N) khi đổi sau mount — useReducer chỉ dùng
  // initial state 1 lần, nên cần effect này để badge bàn cập nhật.
  useEffect(() => {
    if (tableNo != null) dispatch({ type: "setTable", value: tableNo });
  }, [tableNo]);

  // Giá có thể được admin chỉnh trong menu_config (realtime); mặc định = menu.json
  const config = useMenuConfig();
  const totals = useMemo(
    () => computeTotals(state.selection, config, state.size),
    [state.selection, config, state.size],
  );

  const value: BowlContextValue = {
    ...state,
    totals,
    config,
    setTarget: (value) => dispatch({ type: "setTarget", value }),
    setTable: (value) => dispatch({ type: "setTable", value }),
    setSize: (value) => dispatch({ type: "setSize", value }),
    setQty: (id, qty) => dispatch({ type: "setQty", id, qty }),
    toggle: (id) => dispatch({ type: "toggle", id }),
    selectSingle: (group, id) => dispatch({ type: "selectSingle", group, id }),
    loadSelection: (selection, target) =>
      dispatch({ type: "loadSelection", selection, target }),
    reset: () => dispatch({ type: "reset" }),
  };

  return <BowlContext.Provider value={value}>{children}</BowlContext.Provider>;
}

export function useBowl(): BowlContextValue {
  const ctx = useContext(BowlContext);
  if (!ctx) throw new Error("useBowl must be used within BowlProvider");
  return ctx;
}
