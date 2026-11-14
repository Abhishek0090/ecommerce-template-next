"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { STORAGE_KEYS } from "@/config/theme";
import type { CartLine } from "@/data/types";

type Toast = { id: number; title: string; body?: string };

type State = {
  hydrated: boolean;
  cart: CartLine[];
  coupon?: string;
  wishlist: string[];
  cartOpen: boolean;
  toasts: Toast[];
};

type Action =
  | { type: "hydrate"; cart: CartLine[]; coupon?: string; wishlist: string[] }
  | { type: "add"; line: Omit<CartLine, "key"> }
  | { type: "setQty"; key: string; qty: number }
  | { type: "remove"; key: string }
  | { type: "clear" }
  | { type: "coupon"; code?: string }
  | { type: "toggleWish"; id: string }
  | { type: "cartOpen"; open: boolean }
  | { type: "toast"; toast: Toast }
  | { type: "dismiss"; id: number };

const MAX_QTY = 10;
const lineKey = (l: Omit<CartLine, "key">) => [l.productId, l.color ?? "", l.size ?? ""].join("|");

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, hydrated: true, cart: action.cart, coupon: action.coupon, wishlist: action.wishlist };
    case "add": {
      const key = lineKey(action.line);
      const existing = state.cart.find((l) => l.key === key);
      const cart = existing
        ? state.cart.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + action.line.qty) } : l))
        : [...state.cart, { ...action.line, key, qty: Math.min(MAX_QTY, action.line.qty) }];
      return { ...state, cart };
    }
    case "setQty":
      return {
        ...state,
        cart: state.cart
          .map((l) => (l.key === action.key ? { ...l, qty: Math.min(MAX_QTY, action.qty) } : l))
          .filter((l) => l.qty > 0),
      };
    case "remove":
      return { ...state, cart: state.cart.filter((l) => l.key !== action.key) };
    case "clear":
      return { ...state, cart: [], coupon: undefined };
    case "coupon":
      return { ...state, coupon: action.code };
    case "toggleWish":
      return {
        ...state,
        wishlist: state.wishlist.includes(action.id)
          ? state.wishlist.filter((id) => id !== action.id)
          : [...state.wishlist, action.id],
      };
    case "cartOpen":
      return { ...state, cartOpen: action.open };
    case "toast":
      return { ...state, toasts: [...state.toasts.slice(-2), action.toast] };
    case "dismiss":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode): the store still works for this visit.
  }
}

type StoreApi = State & {
  addToCart: (line: Omit<CartLine, "key">, name?: string) => void;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  applyCoupon: (code?: string) => void;
  toggleWishlist: (id: string, name?: string) => void;
  openCart: (open: boolean) => void;
  notify: (title: string, body?: string) => void;
  dismiss: (id: number) => void;
};

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    hydrated: false,
    cart: [],
    wishlist: [],
    cartOpen: false,
    toasts: [],
  });
  const toastId = useRef(0);

  // localStorage is read after mount so server and client render the same first HTML.
  useEffect(() => {
    const saved = readJson<{ lines: CartLine[]; coupon?: string }>(STORAGE_KEYS.cart, { lines: [] });
    dispatch({
      type: "hydrate",
      cart: Array.isArray(saved.lines) ? saved.lines : [],
      coupon: saved.coupon,
      wishlist: readJson<string[]>(STORAGE_KEYS.wishlist, []),
    });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    writeJson(STORAGE_KEYS.cart, { lines: state.cart, coupon: state.coupon });
    writeJson(STORAGE_KEYS.wishlist, state.wishlist);
  }, [state.hydrated, state.cart, state.coupon, state.wishlist]);

  const notify = useCallback((title: string, body?: string) => {
    const id = ++toastId.current;
    dispatch({ type: "toast", toast: { id, title, body } });
    setTimeout(() => dispatch({ type: "dismiss", id }), 3200);
  }, []);

  const api = useMemo<StoreApi>(
    () => ({
      ...state,
      addToCart: (line, name) => {
        dispatch({ type: "add", line });
        notify("Added to cart", name);
      },
      setQty: (key, qty) => dispatch({ type: "setQty", key, qty }),
      removeLine: (key) => dispatch({ type: "remove", key }),
      clearCart: () => dispatch({ type: "clear" }),
      applyCoupon: (code) => dispatch({ type: "coupon", code }),
      toggleWishlist: (id, name) => {
        const had = state.wishlist.includes(id);
        dispatch({ type: "toggleWish", id });
        notify(had ? "Removed from wishlist" : "Saved to wishlist", name);
      },
      openCart: (open) => dispatch({ type: "cartOpen", open }),
      notify,
      dismiss: (id) => dispatch({ type: "dismiss", id }),
    }),
    [state, notify],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
