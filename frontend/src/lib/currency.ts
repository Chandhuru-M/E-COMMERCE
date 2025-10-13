const currencyLocales: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB'
};

export const formatPrice = (amount: number, currency = 'INR') => {
  const locale = currencyLocales[currency] ?? 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    console.warn('[currency] Failed to format price, falling back to symbolless format', error);
    return `${amount.toLocaleString(locale)} ${currency}`.trim();
  }
};
