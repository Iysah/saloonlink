// Tier-based limits configuration and utilities
// This file provides constants and helper functions for enforcing tier limits

export type Tier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface TierLimits {
  stylists: number | null; // null means unlimited
  services: number | null;
  appointmentsPerDay: number | null;
  features: string[];
}

export interface UsageStats {
  stylists: number;
  services: number;
  appointmentsToday: number;
}

export interface TierInfo {
  tier: Tier;
  limits: TierLimits;
  usage: UsageStats;
}

// Tier limits configuration
export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    stylists: 1,
    services: 5,
    appointmentsPerDay: 5,
    features: [
      'Basic booking system',
      'Queue management',
      'Customer reviews',
      'Basic notifications'
    ]
  },
  starter: {
    stylists: 2,
    services: 10,
    appointmentsPerDay: 10,
    features: [
      'Everything in Free',
      'Priority queue',
      'Advanced notifications',
      'Basic analytics'
    ]
  },
  pro: {
    stylists: 5,
    services: null, // unlimited
    appointmentsPerDay: null, // unlimited
    features: [
      'Everything in Starter',
      'Advanced analytics',
      'Marketing campaigns',
      'Custom branding',
      'API access'
    ]
  },
  enterprise: {
    stylists: null, // unlimited
    services: null, // unlimited
    appointmentsPerDay: null, // unlimited
    features: [
      'Everything in Pro',
      'White-label solution',
      'Custom integrations',
      'Dedicated support',
      'Advanced AI features'
    ]
  }
};

// Helper functions
export function getTierLimits(tier: Tier): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function canAddStylist(currentCount: number, tier: Tier): boolean {
  const limit = TIER_LIMITS[tier]?.stylists;
  return limit === null || currentCount < limit;
}

export function canAddService(currentCount: number, tier: Tier): boolean {
  const limit = TIER_LIMITS[tier]?.services;
  return limit === null || currentCount < limit;
}

export function canAddAppointment(currentCount: number, tier: Tier): boolean {
  const limit = TIER_LIMITS[tier]?.appointmentsPerDay;
  return limit === null || currentCount < limit;
}

export function getStylistLimitMessage(tier: Tier): string {
  const limit = TIER_LIMITS[tier]?.stylists;
  if (limit === null) return 'Unlimited stylists';
  return `${limit} stylist${limit > 1 ? 's' : ''}`;
}

export function getServiceLimitMessage(tier: Tier): string {
  const limit = TIER_LIMITS[tier]?.services;
  if (limit === null) return 'Unlimited services';
  return `${limit} services`;
}

export function getAppointmentLimitMessage(tier: Tier): string {
  const limit = TIER_LIMITS[tier]?.appointmentsPerDay;
  if (limit === null) return 'Unlimited appointments per day';
  return `${limit} appointments per day`;
}

export function getUpgradeMessage(currentTier: Tier, feature: 'stylists' | 'services' | 'appointmentsPerDay'): string {
  const currentLimit = TIER_LIMITS[currentTier][feature];
  
  if (currentLimit === null) return '';
  
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return 'Contact us for custom limits';
  
  const nextLimit = TIER_LIMITS[nextTier][feature];
  const limitText = nextLimit === null ? 'unlimited' : nextLimit.toString();
  
  return `Upgrade to ${nextTier.charAt(0).toUpperCase() + nextTier.slice(1)} for ${limitText} ${feature === 'appointmentsPerDay' ? 'appointments per day' : feature}`;
}

export function getNextTier(currentTier: Tier): Tier | null {
  const tiers: Tier[] = ['free', 'starter', 'pro', 'enterprise'];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}

export function getTierDisplayName(tier: Tier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

// Validation functions for forms
export function validateStylistCount(count: number, tier: Tier): { isValid: boolean; message?: string } {
  if (canAddStylist(count, tier)) {
    return { isValid: true };
  }
  
  const limit = TIER_LIMITS[tier]?.stylists;
  return {
    isValid: false,
    message: `You've reached the limit of ${limit} stylist${limit! > 1 ? 's' : ''} for the ${getTierDisplayName(tier)} tier. ${getUpgradeMessage(tier, 'stylists')}`
  };
}

export function validateServiceCount(count: number, tier: Tier): { isValid: boolean; message?: string } {
  if (canAddService(count, tier)) {
    return { isValid: true };
  }
  
  const limit = TIER_LIMITS[tier]?.services;
  return {
    isValid: false,
    message: `You've reached the limit of ${limit} services for the ${getTierDisplayName(tier)} tier. ${getUpgradeMessage(tier, 'services')}`
  };
}

export function validateAppointmentCount(count: number, tier: Tier): { isValid: boolean; message?: string } {
  if (canAddAppointment(count, tier)) {
    return { isValid: true };
  }
  
  const limit = TIER_LIMITS[tier]?.appointmentsPerDay;
  return {
    isValid: false,
    message: `You've reached the limit of ${limit} appointments per day for the ${getTierDisplayName(tier)} tier. ${getUpgradeMessage(tier, 'appointmentsPerDay')}`
  };
}

// Usage tracking helpers
export function getUsagePercentage(current: number, limit: number | null): number {
  if (limit === null) return 0; // unlimited
  return Math.round((current / limit) * 100);
}

export function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600';
  if (percentage >= 75) return 'text-yellow-600';
  return 'text-green-600';
}

// Pricing information (you can customize these values)
export const TIER_PRICING = {
  free: { price: 0, currency: 'USD', period: 'month' },
  starter: { price: 9.99, currency: 'USD', period: 'month' },
  pro: { price: 29.99, currency: 'USD', period: 'month' },
  enterprise: { price: null, currency: 'USD', period: 'month' } // Contact for pricing
}; 

export const plans = [
   {
    plan: "basic" as "basic" | "starter" | "pro" | "enterprise",
    features: {
      stylists: {
        allowed: 1,
        unlimited: false,
      },
      appointments: {
        daily_limit: 5,
        unlimited: false,
        real_time_updates: false,
        priority_queue: false,
        ai_optimization: false,
      },
      hairstyles: {
        predefined_limit: 5,
        custom_uploads: false,
        full_library: false,
      },
      profile: {
        basic_listing: true,
        reviews_visible: false,
      },
      analytics: {
        basic: false,
        intermediate: false,
        advanced: false,
      },
      communication: {
        in_app_messaging: false,
        priority_support: false,
      },
      marketing: {
        push_notifications: false,
      },
    },
    active: true,
    start_date: null,
    billing_cycle: null,
  },
  {
    plan: "starter" as "basic" | "starter" | "pro" | "enterprise",
    features: {
      stylists: {
        allowed: 2,
        unlimited: false,
      },
      appointments: {
        daily_limit: 10,
        unlimited: false,
        real_time_updates: true,
        priority_queue: false,
        ai_optimization: false,
      },
      hairstyles: {
        predefined_limit: 10,
        custom_uploads: false,
        full_library: false,
      },
      profile: {
        basic_listing: true,
        reviews_visible: false,
      },
      analytics: {
        basic: true,
        intermediate: false,
        advanced: false,
      },
      communication: {
        in_app_messaging: false,
        priority_support: false,
      },
      marketing: {
        push_notifications: false,
      },
    },
    active: true,
    start_date: new Date().toISOString(),
    billing_cycle: null,
  },
  {
    plan: "pro" as "basic" | "starter" | "pro" | "enterprise",
    features: {
      stylists: {
        allowed: 5,
        unlimited: false,
      },
      appointments: {
        daily_limit: 0,
        unlimited: true,
        real_time_updates: true,
        priority_queue: false,
        ai_optimization: false,
      },
      hairstyles: {
        predefined_limit: 0,
        custom_uploads: true,
        full_library: true,
      },
      profile: {
        basic_listing: true,
        reviews_visible: true,
      },
      analytics: {
        basic: true,
        intermediate: true,
        advanced: false,
      },
      communication: {
        in_app_messaging: true,
        priority_support: false,
      },
      marketing: {
        push_notifications: false,
      },
    },
    active: true,
    start_date: new Date().toISOString(),
    billing_cycle: null,
  },
  {
    plan: "enterprise" as "basic" | "starter" | "pro" | "enterprise",
    features: {
      stylists: {
        allowed: 0,
        unlimited: true,
      },
      appointments: {
        daily_limit: 0,
        unlimited: true,
        real_time_updates: true,
        priority_queue: true,
        ai_optimization: true,
      },
      hairstyles: {
        predefined_limit: 0,
        custom_uploads: true,
        full_library: false,
      },
      profile: {
        basic_listing: true,
        reviews_visible: true,
      },
      analytics: {
        basic: true,
        intermediate: true,
        advanced: true,
      },
      communication: {
        in_app_messaging: true,
        priority_support: true,
      },
      marketing: {
        push_notifications: true,
      },
    },
    active: true,
    start_date: new Date().toISOString(),
    billing_cycle: null,
  },
]