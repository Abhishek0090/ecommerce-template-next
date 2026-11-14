"use client";

import { createContext, useContext } from "react";
import type { Category, Product } from "@/data/types";

type Catalog = { products: Product[]; categories: Category[] };

const CatalogContext = createContext<Catalog>({ products: [], categories: [] });

/** Gives client components (cart, wishlist, checkout) the active product list loaded on the server. */
export function CatalogProvider({ children, ...catalog }: Catalog & { children: React.ReactNode }) {
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
