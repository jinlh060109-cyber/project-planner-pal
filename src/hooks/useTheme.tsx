import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Theme = "light" | "system" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  cycleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // system
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>("system");

  // Load theme from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("theme_preference")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.theme_preference) {
          const t = data.theme_preference as Theme;
          setThemeState(t);
          applyTheme(t);
        }
      });
  }, [user]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  // Apply on mount
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      applyTheme(t);
      if (user) {
        supabase
          .from("profiles")
          .update({ theme_preference: t } as any)
          .eq("user_id", user.id)
          .then();
      }
    },
    [user]
  );

  const cycleTheme = useCallback(() => {
    const order: Theme[] = ["light", "system", "dark"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
