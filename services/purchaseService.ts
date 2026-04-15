/**
 * purchaseService — In-App Purchase abstraction for Albert.
 *
 * This is a typed stub that mirrors the RevenueCat SDK surface.
 * Swap the implementation section to wire up the real SDK:
 *   npx expo install react-native-purchases
 *
 * All public functions are safe to call without the SDK installed —
 * they return sensible defaults and log a warning.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '@/constants/Config';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PurchaseProduct {
  identifier:    string;
  price:         number;
  priceString:   string;
  currency:      string;
  period:        'monthly' | 'annual' | 'weekly' | 'lifetime';
  introPrice?:   number;
  introPriceString?: string;
  introPeriod?:  string;
}

export interface PurchaseCustomerInfo {
  activeSubscriptions: string[];
  entitlements:        Record<string, PurchaseEntitlement>;
  originalAppUserId:   string;
  latestExpirationDate?: string;
}

export interface PurchaseEntitlement {
  identifier:       string;
  isActive:         boolean;
  willRenew:        boolean;
  expirationDate?:  string;
  latestPurchaseDate: string;
}

export type PurchaseResult =
  | { success: true;  customerInfo: PurchaseCustomerInfo }
  | { success: false; cancelled: boolean; error: string };

// ── Mock products (shown in dev / when SDK not wired) ─────────────────────────

const MOCK_PRODUCTS: PurchaseProduct[] = [
  {
    identifier:    'albert_monthly',
    price:         9.99,
    priceString:   '$9.99',
    currency:      'USD',
    period:        'monthly',
    introPrice:    0,
    introPriceString: 'Free',
    introPeriod:   '7 days',
  },
  {
    identifier:    'albert_annual',
    price:         79.99,
    priceString:   '$79.99',
    currency:      'USD',
    period:        'annual',
    introPrice:    0,
    introPriceString: 'Free',
    introPeriod:   '7 days',
  },
  {
    identifier:  'albert_lifetime',
    price:       199.99,
    priceString: '$199.99',
    currency:    'USD',
    period:      'lifetime',
  },
];

/** Map Albert subscription tier → RevenueCat product identifier. */
export const TIER_TO_PRODUCT: Record<'monthly' | 'annual' | 'lifetime', string> = {
  monthly:  'albert_monthly',
  annual:   'albert_annual',
  lifetime: 'albert_lifetime',
};

/** The entitlement identifier configured in the RevenueCat dashboard. */
export const PREMIUM_ENTITLEMENT = 'premium';

const CACHE_KEY = 'albert-iap-customerinfo-v1';

// ── Lazy SDK loader ───────────────────────────────────────────────────────────

let _Purchases: any = null;
let _configured = false;

async function getSDK(): Promise<any | null> {
  if (_Purchases) return _Purchases;
  try {
    _Purchases = (await import('react-native-purchases')).default;
    return _Purchases;
  } catch {
    return null;
  }
}

// ── Configuration ─────────────────────────────────────────────────────────────

export async function configurePurchases(userId?: string): Promise<void> {
  if (_configured) return;
  const SDK = await getSDK();
  if (!SDK) {
    console.warn('[Albert IAP] react-native-purchases not installed — running in stub mode');
    return;
  }

  try {
    const { Platform } = await import('react-native');
    const key = Platform.OS === 'android'
      ? Config.REVENUECAT_KEY_ANDROID
      : Config.REVENUECAT_KEY_IOS;
    await SDK.configure({ apiKey: key, appUserID: userId });
    _configured = true;
  } catch (e) {
    console.warn('[Albert IAP] configure error:', e);
  }
}

// ── Fetch products ────────────────────────────────────────────────────────────

export async function fetchProducts(): Promise<PurchaseProduct[]> {
  const SDK = await getSDK();
  if (!SDK || !_configured) return MOCK_PRODUCTS;

  try {
    const offerings = await SDK.getOfferings();
    const current   = offerings.current;
    if (!current) return MOCK_PRODUCTS;

    return current.availablePackages.map((pkg: any) => ({
      identifier:    pkg.product.identifier,
      price:         pkg.product.price,
      priceString:   pkg.product.priceString,
      currency:      pkg.product.currencyCode,
      period:        packagePeriod(pkg.packageType),
      introPrice:    pkg.product.introPrice?.price,
      introPriceString: pkg.product.introPrice?.priceString,
      introPeriod:   pkg.product.introPrice?.period,
    }));
  } catch (e) {
    console.warn('[Albert IAP] fetchProducts error:', e);
    return MOCK_PRODUCTS;
  }
}

// ── Purchase ──────────────────────────────────────────────────────────────────

export async function purchaseProduct(identifier: string): Promise<PurchaseResult> {
  const SDK = await getSDK();
  if (!SDK || !_configured) {
    // Stub: simulate success in dev
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(mockCustomerInfo(identifier)));
    return { success: true, customerInfo: mockCustomerInfo(identifier) };
  }

  try {
    const offerings = await SDK.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      (p: any) => p.product.identifier === identifier,
    );
    if (!pkg) return { success: false, cancelled: false, error: 'Product not found' };

    const { customerInfo } = await SDK.purchasePackage(pkg);
    const info = mapCustomerInfo(customerInfo);
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(info));
    return { success: true, customerInfo: info };
  } catch (e: any) {
    if (e.userCancelled) return { success: false, cancelled: true, error: 'User cancelled' };
    return { success: false, cancelled: false, error: e.message ?? 'Purchase failed' };
  }
}

// ── Restore ───────────────────────────────────────────────────────────────────

export async function restorePurchases(): Promise<PurchaseCustomerInfo> {
  const SDK = await getSDK();
  if (!SDK || !_configured) {
    const cached = await getCachedCustomerInfo();
    return cached ?? emptyCustomerInfo();
  }

  try {
    const customerInfo = await SDK.restorePurchases();
    const info = mapCustomerInfo(customerInfo);
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(info));
    return info;
  } catch (e) {
    console.warn('[Albert IAP] restorePurchases error:', e);
    return emptyCustomerInfo();
  }
}

// ── Customer info ─────────────────────────────────────────────────────────────

export async function getCustomerInfo(): Promise<PurchaseCustomerInfo> {
  const SDK = await getSDK();
  if (!SDK || !_configured) {
    return (await getCachedCustomerInfo()) ?? emptyCustomerInfo();
  }

  try {
    const info = mapCustomerInfo(await SDK.getCustomerInfo());
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(info));
    return info;
  } catch {
    return (await getCachedCustomerInfo()) ?? emptyCustomerInfo();
  }
}

export function isSubscriptionActive(info: PurchaseCustomerInfo): boolean {
  return (
    info.activeSubscriptions.length > 0 ||
    Object.values(info.entitlements).some(e => e.identifier === PREMIUM_ENTITLEMENT && e.isActive)
  );
}

/**
 * Infer the Albert subscription tier from a customer info object.
 * Returns null if no active entitlement is found.
 */
export function inferTier(info: PurchaseCustomerInfo): 'monthly' | 'annual' | 'lifetime' | null {
  const ids = info.activeSubscriptions;
  if (ids.includes('albert_lifetime')) return 'lifetime';
  if (ids.includes('albert_annual'))   return 'annual';
  if (ids.includes('albert_monthly'))  return 'monthly';
  // Fallback: use entitlement's product identifier when available
  const ent = Object.values(info.entitlements).find(e => e.isActive);
  if (ent?.identifier === PREMIUM_ENTITLEMENT) return 'monthly';
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getCachedCustomerInfo(): Promise<PurchaseCustomerInfo | null> {
  try {
    const json = await AsyncStorage.getItem(CACHE_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

function emptyCustomerInfo(): PurchaseCustomerInfo {
  return { activeSubscriptions: [], entitlements: {}, originalAppUserId: '' };
}

function mockCustomerInfo(productId: string): PurchaseCustomerInfo {
  const now = new Date();
  const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return {
    activeSubscriptions:  [productId],
    originalAppUserId:    'dev-user',
    latestExpirationDate: expiry,
    entitlements: {
      premium: {
        identifier:         'premium',
        isActive:           true,
        willRenew:          true,
        expirationDate:     expiry,
        latestPurchaseDate: now.toISOString(),
      },
    },
  };
}

function mapCustomerInfo(raw: any): PurchaseCustomerInfo {
  const entitlements: Record<string, PurchaseEntitlement> = {};
  for (const [key, val] of Object.entries(raw.entitlements?.active ?? {})) {
    const e = val as any;
    entitlements[key] = {
      identifier:         key,
      isActive:           e.isActive,
      willRenew:          e.willRenew,
      expirationDate:     e.expirationDate,
      latestPurchaseDate: e.latestPurchaseDate,
    };
  }
  return {
    activeSubscriptions:  raw.activeSubscriptions ?? [],
    originalAppUserId:    raw.originalAppUserId ?? '',
    latestExpirationDate: raw.latestExpirationDate,
    entitlements,
  };
}

function packagePeriod(type: string): PurchaseProduct['period'] {
  if (type === 'ANNUAL')   return 'annual';
  if (type === 'MONTHLY')  return 'monthly';
  if (type === 'WEEKLY')   return 'weekly';
  if (type === 'LIFETIME') return 'lifetime';
  return 'monthly';
}
