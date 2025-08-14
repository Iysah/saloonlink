import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Tier, TierInfo, UsageStats, getTierLimits } from '@/lib/tierLimits';


const supabase = createClient()

export function useTierLimits(userId?: string) {
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchTierInfo() {
      try {
        setLoading(true);
        setError(null);

        // Call the database function to get usage stats
        const { data, error: dbError } = await supabase
          .rpc('get_usage_stats', { barber_user_id: userId });

        if (dbError) {
          throw new Error(dbError.message);
        }

        if (data) {
          const tier = data.tier as Tier;
          const limits = getTierLimits(tier);
          const usage: UsageStats = {
            stylists: data.usage.stylists,
            services: data.usage.services,
            appointmentsToday: data.usage.appointments_today
          };

          setTierInfo({
            tier,
            limits,
            usage
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tier information');
      } finally {
        setLoading(false);
      }
    }

    fetchTierInfo();
  }, [userId]);

  return { tierInfo, loading, error };
}

// Hook for checking if user can perform specific actions
export function useTierActions(userId?: string) {
  const { tierInfo, loading, error } = useTierLimits(userId);

  const canAddStylist = () => {
    if (!tierInfo) return false;
    const { limits, usage } = tierInfo;
    return limits.stylists === null || usage.stylists < limits.stylists;
  };

  const canAddService = () => {
    if (!tierInfo) return false;
    const { limits, usage } = tierInfo;
    return limits.services === null || usage.services < limits.services;
  };

  const canAddAppointment = () => {
    if (!tierInfo) return false;
    const { limits, usage } = tierInfo;
    return limits.appointmentsPerDay === null || usage.appointmentsToday < limits.appointmentsPerDay;
  };

  const getStylistUsagePercentage = () => {
    if (!tierInfo) return 0;
    const { limits, usage } = tierInfo;
    if (limits.stylists === null) return 0;
    return Math.round((usage.stylists / limits.stylists) * 100);
  };

  const getServiceUsagePercentage = () => {
    if (!tierInfo) return 0;
    const { limits, usage } = tierInfo;
    if (limits.services === null) return 0;
    return Math.round((usage.services / limits.services) * 100);
  };

  const getAppointmentUsagePercentage = () => {
    if (!tierInfo) return 0;
    const { limits, usage } = tierInfo;
    if (limits.appointmentsPerDay === null) return 0;
    return Math.round((usage.appointmentsToday / limits.appointmentsPerDay) * 100);
  };

  return {
    tierInfo,
    loading,
    error,
    canAddStylist,
    canAddService,
    canAddAppointment,
    getStylistUsagePercentage,
    getServiceUsagePercentage,
    getAppointmentUsagePercentage
  };
} 