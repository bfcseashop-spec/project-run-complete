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
  }
} catch { /* ignore */ }

createRoot(document.getElementById("root")!).render(<App />);
