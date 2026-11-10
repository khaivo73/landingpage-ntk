"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
const PackageContext = createContext<{
  demand: string;
  setDemand: (value: string) => void;
} | null>(null);
export function PackageSelectionProvider({ children }: { children: ReactNode }) {
  const [demand, setDemand] = useState("");
  return <PackageContext.Provider value={{ demand, setDemand }}>{children}</PackageContext.Provider>;
}
export function usePackageSelection() {
  const selection = useContext(PackageContext);
  if (!selection) throw new Error("PackageSelectionProvider is required");
  return selection;
}
