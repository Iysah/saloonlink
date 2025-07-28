import React from 'react';
import { useTierActions } from '@/hooks/useTierLimits';
import { TierUsageCard } from '@/components/ui/tier-usage-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Users, Scissors, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarberTierDashboardProps {
  userId: string;
  onAddStylist?: () => void;
  onAddService?: () => void;
  onUpgrade?: () => void;
}

export function BarberTierDashboard({ 
  userId, 
  onAddStylist, 
  onAddService, 
  onUpgrade 
}: BarberTierDashboardProps) {
  const { 
    tierInfo, 
    loading, 
    error,
    canAddStylist, 
    canAddService, 
    canAddAppointment,
    getStylistUsagePercentage,
    getServiceUsagePercentage,
    getAppointmentUsagePercentage
  } = useTierActions(userId);

  const { toast } = useToast();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load tier information: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!tierInfo) {
    return (
      <Alert>
        <AlertDescription>
          No tier information available. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  const handleAddStylist = () => {
    if (!canAddStylist()) {
      toast({
        title: "Stylist Limit Reached",
        description: "You've reached the maximum number of stylists for your current plan. Please upgrade to add more stylists.",
        variant: "destructive"
      });
      return;
    }
    onAddStylist?.();
  };

  const handleAddService = () => {
    if (!canAddService()) {
      toast({
        title: "Service Limit Reached",
        description: "You've reached the maximum number of services for your current plan. Please upgrade to add more services.",
        variant: "destructive"
      });
      return;
    }
    onAddService?.();
  };

  return (
    <div className="space-y-6">
      {/* Tier Usage Card */}
      <TierUsageCard
        tier={tierInfo.tier}
        usage={tierInfo.usage}
        limits={tierInfo.limits}
        onUpgrade={onUpgrade}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your salon operations within your plan limits
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Add Stylist */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">Add Stylist</span>
            </div>
            <Button 
              onClick={handleAddStylist}
              disabled={!canAddStylist()}
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stylist
            </Button>
            {!canAddStylist() && (
              <p className="text-xs text-red-600">
                Limit reached. Upgrade to add more stylists.
              </p>
            )}
          </div>

          {/* Add Service */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              <span className="font-medium">Add Service</span>
            </div>
            <Button 
              onClick={handleAddService}
              disabled={!canAddService()}
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
            {!canAddService() && (
              <p className="text-xs text-red-600">
                Limit reached. Upgrade to add more services.
              </p>
            )}
          </div>

          {/* Appointments Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Today's Appointments</span>
            </div>
            <div className="text-2xl font-bold">
              {tierInfo.usage.appointmentsToday}
              {tierInfo.limits.appointmentsPerDay && (
                <span className="text-sm font-normal text-muted-foreground">
                  / {tierInfo.limits.appointmentsPerDay}
                </span>
              )}
            </div>
            {!canAddAppointment() && (
              <p className="text-xs text-red-600">
                Daily limit reached. Upgrade for unlimited appointments.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Alerts */}
      {(getStylistUsagePercentage() >= 75 || 
        getServiceUsagePercentage() >= 75 || 
        getAppointmentUsagePercentage() >= 75) && (
        <Alert>
          <AlertDescription>
            You're approaching your plan limits. Consider upgrading to avoid restrictions on your business operations.
          </AlertDescription>
        </Alert>
      )}

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Your Plan Features</CardTitle>
          <CardDescription>
            Features included in your {tierInfo.tier} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {tierInfo.limits.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 