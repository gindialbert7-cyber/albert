import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionTier = 'free' | 'monthly' | 'annual' | 'lifetime';

export interface SubscriptionState {
  tier:            SubscriptionTier;
  isActive:        boolean;
  expiresAt:       string | null;   // ISO string (serializable)
  trialDaysLeft:   number;
  isTrialing:      boolean;
  hasSeenOnboarding: boolean;

  // actions
  subscribe:           (tier: SubscriptionTier) => void;
  cancelSub:           () => void;
  startTrial:          (days?: number) => void;
  markOnboardingDone:  () => void;
}

export const SUBSCRIPTION_PRICES: Record<Exclude<SubscriptionTier, 'free'>, { price: string; period: string; annualNote?: string }> = {
  monthly:  { price: '$9.99',   period: 'month' },
  annual:   { price: '$79.99',  period: 'year',  annualNote: 'Save 33%' },
  lifetime: { price: '$199.99', period: 'once',  annualNote: 'Best value' },
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      tier:               'free',
      isActive:           false,
      expiresAt:          null,
      trialDaysLeft:      0,
      isTrialing:         false,
      hasSeenOnboarding:  false,

      subscribe: (tier) => {
        const expiresAt = tier === 'lifetime' ? null :
          tier === 'annual'  ? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString() :
                               new Date(Date.now() +  30 * 24 * 3600 * 1000).toISOString();
        set({ tier, isActive: true, expiresAt, isTrialing: false });
      },

      cancelSub: () => {
        set({ tier: 'free', isActive: false, expiresAt: null, isTrialing: false });
      },

      startTrial: (days = 7) => {
        const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
        set({ isTrialing: true, isActive: true, trialDaysLeft: days, expiresAt, tier: 'monthly' });
      },

      markOnboardingDone: () => set({ hasSeenOnboarding: true }),
    }),
    {
      name:    'albert-subscription-v2',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function useHasAccess(): boolean {
  const { isActive, isTrialing } = useSubscriptionStore();
  return isActive || isTrialing;
}
