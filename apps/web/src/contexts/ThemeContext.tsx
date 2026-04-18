import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeContextValue = {
  dark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem("cyberpath-theme") !== "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("cyberpath-theme", dark ? "dark" : "light");
  }, [dark]);

  const value = useMemo(() => ({ dark, toggleTheme: () => setDark((value) => !value) }), [dark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
