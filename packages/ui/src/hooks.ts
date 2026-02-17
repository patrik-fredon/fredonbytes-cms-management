import { useContext } from "react";
import { FredonBytesContext } from "./provider";

export function useFredonBytes() {
  const value = useContext(FredonBytesContext);
  if (!value) {
    throw new Error("useFredonBytes must be used within FredonBytesProvider");
  }
  return value;
}
