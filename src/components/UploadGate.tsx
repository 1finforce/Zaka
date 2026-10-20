"use client";
import { createContext, useContext, useState } from "react";

/** Lets a receipt upload hold back its form's submit button until the file is stored. */
const Ctx = createContext<{ busy: boolean; setBusy: (b: boolean) => void }>({ busy: false, setBusy: () => {} });
export const useUploadGate = () => useContext(Ctx);

export default function UploadGate({ children }: { children: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  return <Ctx.Provider value={{ busy, setBusy }}>{children}</Ctx.Provider>;
}
