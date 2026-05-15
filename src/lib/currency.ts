/**
 * Formats a number as a currency string based on the user's preference.
 * Uses the Intl.NumberFormat API for internationalization support.
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat(navigator.language || 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (err) {
    // Fallback if currency code is invalid or not supported
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

/**
 * Common currencies supported by the app
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)', flag: '🇺🇸' },
  { code: 'CAD', label: 'Canadian Dollar ($)', flag: '🇨🇦' },
  { code: 'EUR', label: 'Euro (€)', flag: '🇪🇺' },
  { code: 'GBP', label: 'British Pound (£)', flag: '🇬🇧' },
  { code: 'INR', label: 'Indian Rupee (₹)', flag: '🇮🇳' },
  { code: 'AUD', label: 'Australian Dollar ($)', flag: '🇦🇺' },
  { code: 'JPY', label: 'Japanese Yen (¥)', flag: '🇯🇵' },
  { code: 'SGD', label: 'Singapore Dollar ($)', flag: '🇸🇬' },
  { code: 'AED', label: 'UAE Dirham', flag: '🇦🇪' },
];
