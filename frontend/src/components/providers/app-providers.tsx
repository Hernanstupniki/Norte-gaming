"use client";

import { StoreProvider } from "@/context/store-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}
