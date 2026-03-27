"use client";

import { ChildSessionProvider } from "../context/ChildSessionContext";

export function Providers({ children }) {
  return <ChildSessionProvider>{children}</ChildSessionProvider>;
}
