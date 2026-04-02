import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  cycleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>("light");

  // Load theme from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("theme_preference")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.theme_preference && (data.theme_preference === "light" || data.theme_preference === "dark")) {
          setThemeState(data.theme_preference);
          applyTheme(data.theme_preference);
        }
      });
  }, [user]);

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
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
