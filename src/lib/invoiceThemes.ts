export interface InvoiceTheme {
  id: string;
  name: string;
  description: string;
  headerBg: string;
  headerGradient: string;
  headerText: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
  patientBg: string;
  patientBorder: string;
  patientLabel: string;
  doctorBg: string;
  doctorBorder: string;
  doctorLabel: string;
  tableBorder: string;
  tableHeader: string;
  tableHeaderGradient: string;
  totalBorderColor: string;
  footerBg: string;
  footerText: string;
}

export const invoiceThemes: InvoiceTheme[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean professional layout with traditional styling",
    headerBg: "#1e293b",
    headerGradient: "linear-gradient(135deg,#1e293b,#334155)",
    headerText: "#ffffff",
    accent: "#1e293b",
    accentLight: "#334155",
    accentBorder: "#475569",
    patientBg: "#f1f5f9",
    patientBorder: "#cbd5e1",
    patientLabel: "#475569",
    doctorBg: "#f1f5f9",
    doctorBorder: "#cbd5e1",
    doctorLabel: "#475569",
    tableBorder: "#e2e8f0",
    tableHeader: "#f8fafc",
    tableHeaderGradient: "linear-gradient(135deg,#f8fafc,#f1f5f9)",
    totalBorderColor: "#1e293b",
    footerBg: "linear-gradient(135deg,#f8fafc,#f1f5f9)",
    footerText: "#475569",
  },
  {
    id: "modern-teal",
    name: "Modern Teal",
    description: "Fresh teal gradient with modern card-based design",
    headerBg: "#0f766e",
    headerGradient: "linear-gradient(135deg,#0f766e,#0369a1)",
    headerText: "#ffffff",
    accent: "#0f766e",
    accentLight: "#14b8a6",
    accentBorder: "#5eead4",
    patientBg: "#f0fdf4",
    patientBorder: "#bbf7d0",
    patientLabel: "#16a34a",
    doctorBg: "#eff6ff",
    doctorBorder: "#bfdbfe",
    doctorLabel: "#2563eb",
    tableBorder: "#e2e8f0",
    tableHeader: "#f0fdfa",
    tableHeaderGradient: "linear-gradient(135deg,#f0fdfa,#ecfdf5)",
    totalBorderColor: "#0f766e",
    footerBg: "linear-gradient(135deg,#f0fdfa,#ecfdf5)",
    footerText: "#0f766e",
  },
  {
    id: "royal-blue",
    name: "Royal Blue",
    description: "Elegant blue theme with sophisticated typography",
    headerBg: "#1e40af",
    headerGradient: "linear-gradient(135deg,#1e40af,#3b82f6)",
    headerText: "#ffffff",
    accent: "#1e40af",
    accentLight: "#3b82f6",
    accentBorder: "#93c5fd",
    patientBg: "#eff6ff",
    patientBorder: "#bfdbfe",
    patientLabel: "#2563eb",
    doctorBg: "#eef2ff",
    doctorBorder: "#c7d2fe",
    doctorLabel: "#4f46e5",
    tableBorder: "#dbeafe",
    tableHeader: "#eff6ff",
    tableHeaderGradient: "linear-gradient(135deg,#eff6ff,#eef2ff)",
    totalBorderColor: "#1e40af",
    footerBg: "linear-gradient(135deg,#eff6ff,#eef2ff)",
    footerText: "#1e40af",
  },
  {
    id: "minimal-gray",
    name: "Minimal Gray",
    description: "Ultra-clean minimalist with subtle gray accents",
    headerBg: "#374151",
    headerGradient: "linear-gradient(135deg,#374151,#4b5563)",
    headerText: "#ffffff",
    accent: "#374151",
    accentLight: "#6b7280",
    accentBorder: "#9ca3af",
    patientBg: "#f9fafb",
    patientBorder: "#e5e7eb",
    patientLabel: "#6b7280",
    doctorBg: "#f9fafb",
    doctorBorder: "#e5e7eb",
    doctorLabel: "#6b7280",
    tableBorder: "#e5e7eb",
    tableHeader: "#f9fafb",
    tableHeaderGradient: "#f9fafb",
    totalBorderColor: "#374151",
    footerBg: "#f9fafb",
    footerText: "#6b7280",
  },
  {
    id: "warm-coral",
    name: "Warm Coral",
    description: "Warm and inviting with coral and gold highlights",
    headerBg: "#c2410c",
    headerGradient: "linear-gradient(135deg,#c2410c,#ea580c)",
    headerText: "#ffffff",
    accent: "#c2410c",
    accentLight: "#f97316",
    accentBorder: "#fdba74",
    patientBg: "#fff7ed",
    patientBorder: "#fed7aa",
    patientLabel: "#c2410c",
    doctorBg: "#fffbeb",
    doctorBorder: "#fde68a",
    doctorLabel: "#b45309",
    tableBorder: "#fed7aa",
    tableHeader: "#fff7ed",
    tableHeaderGradient: "linear-gradient(135deg,#fff7ed,#fffbeb)",
    totalBorderColor: "#c2410c",
    footerBg: "linear-gradient(135deg,#fff7ed,#fffbeb)",
    footerText: "#c2410c",
  },
];

export function getInvoiceTheme(themeId: string): InvoiceTheme {
  return invoiceThemes.find(t => t.id === themeId) || invoiceThemes[1]; // default modern-teal
}
