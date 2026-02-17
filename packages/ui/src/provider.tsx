import React from "react";
import { createContext } from "react";

export const FredonBytesContext = createContext<unknown>(undefined);

export function FredonBytesProvider(
  { value, children }: { value: unknown; children: React.ReactNode },
) {
  return (
    <FredonBytesContext.Provider value={value}>
      {children}
    </FredonBytesContext.Provider>
  );
}
