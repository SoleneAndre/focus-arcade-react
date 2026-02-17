import { createContext, useContext, useState } from "react";

type Mode = "child" | "therapist";

const ModeCtx = createContext<{
  mode: Mode;
  setMode: (m: Mode) => void;
}>({
  mode: "therapist",
  setMode: () => {},
});

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("therapist");

  return (
    <ModeCtx.Provider value={{ mode, setMode }}>
      {children}
    </ModeCtx.Provider>
  );
}

export const useMode = () => useContext(ModeCtx);
