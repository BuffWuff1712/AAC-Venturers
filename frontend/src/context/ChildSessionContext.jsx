"use client";

import { createContext, useContext, useState } from "react";

const ChildSessionContext = createContext(null);

export function ChildSessionProvider({ children }) {
  const [sessionSnapshot, setSessionSnapshot] = useState({});

  return (
    <ChildSessionContext.Provider value={{ sessionSnapshot, setSessionSnapshot }}>
      {children}
    </ChildSessionContext.Provider>
  );
}

export function useChildSession() {
  const context = useContext(ChildSessionContext);
  if (!context) {
    throw new Error("useChildSession must be used inside ChildSessionProvider");
  }
  return context;
}
