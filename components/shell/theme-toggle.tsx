"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const storageKey = "campus-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(storageKey);
    const nextTheme: Theme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : "light";

    applyTheme(nextTheme);
    queueMicrotask(() => setTheme(nextTheme));
  }, []);

  function selectTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Alternar tema">
      <button
        type="button"
        className={`theme-option ${theme === "light" ? "active" : ""}`}
        onClick={() => selectTheme("light")}
        aria-pressed={theme === "light"}
      >
        <SunMedium size={16} />
        <span>Claro</span>
      </button>
      <button
        type="button"
        className={`theme-option ${theme === "dark" ? "active" : ""}`}
        onClick={() => selectTheme("dark")}
        aria-pressed={theme === "dark"}
      >
        <MoonStar size={16} />
        <span>Escuro</span>
      </button>
    </div>
  );
}
