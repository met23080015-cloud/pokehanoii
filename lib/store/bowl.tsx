"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { groups, type GroupKey } from "@/lib/menu";
import { computeTotals, type Selection, type Totals } from "@/lib/nutrition";

interface BowlState {
  tableNo: number | null;
  calorieTarget: number;
  selection: Selection;
}

type Action =
  | { type: "setTarget"; value: number }
  | { type: "setQty"; id: string; qty: number }
  | { type: "toggle"; id: string }
  | { type: "selectSingle"; group: GroupKey; id: string }
  | { type: "reset" };

function reducer(state: BowlState, action: Action): BowlState {
  switch (action.type) {
    case "setTarget":
      return { ...state, calorieTarget: action.value };
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
    case "reset":
      return { ...state, selection: {}, calorieTarget: state.calorieTarget };
    default:
      return state;
  }
}

interface BowlContextValue extends BowlState {
  totals: Totals;
  setTarget: (v: number) => void;
  setQty: (id: string, qty: number) => void;
  toggle: (id: string) => void;
  selectSingle: (group: GroupKey, id: string) => void;
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
  });

  const totals = useMemo(() => computeTotals(state.selection), [state.selection]);

  const value: BowlContextValue = {
    ...state,
    totals,
    setTarget: (value) => dispatch({ type: "setTarget", value }),
    setQty: (id, qty) => dispatch({ type: "setQty", id, qty }),
    toggle: (id) => dispatch({ type: "toggle", id }),
    selectSingle: (group, id) => dispatch({ type: "selectSingle", group, id }),
    reset: () => dispatch({ type: "reset" }),
  };

  return <BowlContext.Provider value={value}>{children}</BowlContext.Provider>;
}

export function useBowl(): BowlContextValue {
  const ctx = useContext(BowlContext);
  if (!ctx) throw new Error("useBowl must be used within BowlProvider");
  return ctx;
}
