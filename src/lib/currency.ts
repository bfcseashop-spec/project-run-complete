import { getSettings } from "@/data/settingsStore";

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export const currencies: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "KHR", name: "Cambodian Riel", symbol: "៛" },
];

export const getCurrencySymbol = (code?: string): string => {
  const c = code || getSettings().currency;
  return currencies.find((cur) => cur.code === c)?.symbol || "$";
};

/** Format a price in the primary currency */
export const formatPrice = (amount: number, currencyCode?: string): string => {
  const settings = getSettings();
  const code = currencyCode || settings.currency;
  const symbol = settings.showCurrencySymbol ? getCurrencySymbol(code) : "";
  return `${symbol}${amount.toLocaleString()}`;
};

/** Convert primary currency amount to the secondary currency */
export const convertToSecondary = (amountInPrimary: number): number => {
  const { exchangeRate } = getSettings();
  return Math.round(amountInPrimary * exchangeRate);
};

/** Format a price showing both currencies: "$100 / ៛410,000" */
export const formatDualPrice = (amount: number): string => {
  const settings = getSettings();
  if (!settings.dualCurrencyEnabled) return formatPrice(amount);

  const primarySymbol = settings.showCurrencySymbol ? getCurrencySymbol(settings.currency) : "";
  const secondarySymbol = settings.showCurrencySymbol ? getCurrencySymbol(settings.secondaryCurrency) : "";
  const secondaryAmount = convertToSecondary(amount);

  return `${primarySymbol}${amount.toLocaleString()} / ${secondarySymbol}${secondaryAmount.toLocaleString()}`;
};
