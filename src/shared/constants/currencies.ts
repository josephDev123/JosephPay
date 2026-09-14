export const SUPPORTED_CURRENCIES = ['NGN', 'USD'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
