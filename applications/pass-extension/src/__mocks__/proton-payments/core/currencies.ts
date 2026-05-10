import type { Currency } from '../index';

export type CurrencyFormattingConfig = {
    divisor: number;
    symbolPosition: 'prefix-space' | 'prefix-nospace' | 'suffix-space';
};

const DEFAULT_CONFIG: CurrencyFormattingConfig = {
    divisor: 100,
    symbolPosition: 'prefix-space',
};

export const getCurrencyFormattingConfig = (_currency: Currency): CurrencyFormattingConfig => DEFAULT_CONFIG;

export const getCurrencyFormattingConfigWithoutFallback = (currency: Currency): CurrencyFormattingConfig | undefined =>
    currency ? DEFAULT_CONFIG : undefined;
