export type Currency = 'USD' | 'EUR' | 'CHF' | string;
export type Plan = { Name?: string; [key: string]: unknown };
export type Subscription = { Plans?: Plan[]; [key: string]: unknown };
export type Invoice = Record<string, unknown>;
export type COUPON_CODES = string;
export type PlanIDs = Record<string, number>;

export enum PLANS {
    FREE = 'free',
    MAIL = 'mail2022',
    MAIL_PRO = 'mailpro2022',
    MAIL_BUSINESS = 'mailbiz2024',
    DRIVE = 'drive2022',
    DRIVE_PRO = 'drivepro2022',
    DRIVE_BUSINESS = 'drivebiz2024',
    DRIVE_1TB = 'drive1tb2022',
    VPN2024 = 'vpn2024',
    VPN_PRO = 'vpnpro2023',
    VPN_BUSINESS = 'vpnbiz2023',
    VPN_PASS_BUNDLE = 'vpnpass2023',
    VPN_PASS_BUNDLE_BUSINESS = 'vpnpassbiz2023',
    BUNDLE = 'bundle2022',
    BUNDLE_PRO = 'bundlepro2022',
    BUNDLE_PRO_2024 = 'bundlepro2024',
    BUNDLE_BIZ_2025 = 'bundlebiz2025',
    FAMILY = 'family2022',
    DUO = 'duo2024',
    PASS = 'pass2023',
    PASS_LIFETIME = 'passlifetime2023',
    PASS_PRO = 'passpro2023',
    PASS_BUSINESS = 'passbiz2023',
    PASS_FAMILY = 'passfamily2024',
    VISIONARY = 'visionary2022',
    LUMO_BUSINESS = 'lumobiz2025',
    MEET_BUSINESS = 'meetbiz2025',
}

export const PLAN_NAMES: Record<string, string> = {
    [PLANS.FREE]: 'Free',
    [PLANS.PASS]: 'Pass Plus',
    [PLANS.PASS_LIFETIME]: 'Pass Lifetime',
    [PLANS.PASS_PRO]: 'Pass Professional',
    [PLANS.PASS_BUSINESS]: 'Pass Business',
    [PLANS.PASS_FAMILY]: 'Pass Family',
    [PLANS.BUNDLE]: 'Proton Unlimited',
    [PLANS.FAMILY]: 'Proton Family',
    [PLANS.DUO]: 'Proton Duo',
    [PLANS.VISIONARY]: 'Visionary',
    [PLANS.MAIL]: 'Mail Plus',
    [PLANS.DRIVE]: 'Drive Plus',
    [PLANS.VPN2024]: 'VPN Plus',
};

export const CurrencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    CHF: 'CHF',
};

export const PASS_LAUNCH_OFFER = 'pass-launch';

export const getDefaultMainCurrency = (): Currency => 'USD';

export const getIsB2BAudienceFromPlan = (planName?: string) => Boolean(planName && /business|biz|pro/i.test(planName));

export const getIsB2BAudienceFromSubscription = (subscription?: Subscription) =>
    Boolean(subscription?.Plans?.some((plan) => getIsB2BAudienceFromPlan(plan.Name)));

export const isFreeSubscription = (subscription?: Subscription | null) =>
    !subscription || !subscription.Plans || subscription.Plans.length === 0;

export const hasFree = isFreeSubscription;

export const getPlanName = (subscription?: Subscription | null) => subscription?.Plans?.[0]?.Name ?? PLANS.FREE;

export const getPlan = (subscription?: Subscription | null) => subscription?.Plans?.[0];

export const getPrice = () => 0;
export const getPlanNameFromIDs = (planIDs: PlanIDs) => Object.keys(planIDs)[0] ?? PLANS.FREE;
export const getPlansWithAddons = () => [];
