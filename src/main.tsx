import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Restore system appearance settings on load
try {
  const raw = localStorage.getItem("clinic-system-manage");
  if (raw) {
    const s = JSON.parse(raw);
    const root = document.documentElement;
    if (s.fontSize) root.style.fontSize = s.fontSize;
    if (s.borderRadius) root.style.setProperty("--radius", s.borderRadius);
    if (s.mode === "dark") root.classList.add("dark");
    else if (s.mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) root.classList.add("dark");

    // Restore fonts
    if (s.bodyFont) root.style.setProperty("--font-body", s.bodyFont);
    if (s.headingFont) {
      root.style.setProperty("--font-heading", s.headingFont === "__same__" ? (s.bodyFont || "") : s.headingFont);
    }
    if (s.numberFont) {
      root.style.setProperty("--font-number", s.numberFont === "__same__" ? (s.bodyFont || "'Inter', system-ui, sans-serif") : s.numberFont);
    }

    // Load Google Fonts
    const imports: string[] = [];
    const fontMap: Record<string, string> = {
      "'Inter', system-ui, sans-serif": "Inter:wght@300;400;500;600;700",
      "'Spectral', serif": "Spectral:wght@300;400;500;600;700",
      "'Lexend', sans-serif": "Lexend:wght@300;400;500;600;700",
      "'Roboto', sans-serif": "Roboto:wght@300;400;500;700",
      "'Open Sans', sans-serif": "Open+Sans:wght@300;400;600;700",
      "'Noto Sans', sans-serif": "Noto+Sans:wght@300;400;500;600;700",
      "'Lato', sans-serif": "Lato:wght@300;400;700",
      "'Source Sans 3', sans-serif": "Source+Sans+3:wght@300;400;600;700",
      "'PT Sans', sans-serif": "PT+Sans:wght@400;700",
      "'Merriweather', serif": "Merriweather:wght@300;400;700",
      "'Fira Sans', sans-serif": "Fira+Sans:wght@300;400;500;600;700",
      "'Poppins', sans-serif": "Poppins:wght@300;400;500;600;700",
      "'Nunito', sans-serif": "Nunito:wght@300;400;600;700",
      "'DM Sans', sans-serif": "DM+Sans:wght@300;400;500;700",
      "'Playfair Display', Georgia, serif": "Playfair+Display:wght@600;700",
      "'Montserrat', sans-serif": "Montserrat:wght@500;600;700;800",
      "'Raleway', sans-serif": "Raleway:wght@500;600;700",
      "'Oswald', sans-serif": "Oswald:wght@400;500;600;700",
      "'Bitter', serif": "Bitter:wght@400;600;700",
    };
    if (s.bodyFont && fontMap[s.bodyFont]) imports.push(fontMap[s.bodyFont]);
    if (s.headingFont && s.headingFont !== "__same__" && fontMap[s.headingFont]) imports.push(fontMap[s.headingFont]);
    if (imports.length) {
      const link = document.createElement("link");
      link.id = "system-manage-fonts";
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?${imports.map(i => `family=${i}`).join("&")}&display=swap`;
      document.head.appendChild(link);
    }

    // Restore color theme
    const themes: Record<string, { primary: string; accent: string; success: string }> = {
      teal: { primary: "168 80% 30%", accent: "200 80% 45%", success: "152 60% 40%" },
      blue: { primary: "220 80% 45%", accent: "240 70% 55%", success: "152 60% 40%" },
      purple: { primary: "270 70% 45%", accent: "290 65% 50%", success: "152 60% 40%" },
      rose: { primary: "350 70% 45%", accent: "10 75% 50%", success: "152 60% 40%" },
      amber: { primary: "30 90% 45%", accent: "45 95% 50%", success: "152 60% 40%" },
      emerald: { primary: "152 70% 35%", accent: "168 65% 40%", success: "140 60% 40%" },
      slate: { primary: "215 25% 35%", accent: "210 30% 45%", success: "152 60% 40%" },
      indigo: { primary: "240 60% 50%", accent: "225 70% 55%", success: "152 60% 40%" },
    };
    const t = themes[s.colorTheme];
    if (t) {
      root.style.setProperty("--primary", t.primary);
      root.style.setProperty("--ring", t.primary);
      root.style.setProperty("--accent", t.accent);
      root.style.setProperty("--success", t.success);
      root.style.setProperty("--sidebar-primary", t.primary.replace(/(\d+)%$/, (_, p) => `${Math.min(100, parseInt(p) + 15)}%`));
      root.style.setProperty("--sidebar-ring", t.primary);
    }
  }
} catch { /* ignore */ }

createRoot(document.getElementById("root")!).render(<App />);
