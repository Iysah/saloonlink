import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Progress } from './progress';
import { Badge } from './badge';
import { Button } from './button';
import { AlertTriangle, CheckCircle, Infinity } from 'lucide-react';
import { Tier, getUsageColor, getTierDisplayName, getUpgradeMessage } from '@/lib/tierLimits';

interface TierUsageCardProps {
  tier: Tier;
  usage: {
    stylists: number;
    services: number;
    appointmentsToday: number;
  };
  limits: {
    stylists: number | null;
    services: number | null;
    appointmentsPerDay: number | null;
  };
  onUpgrade?: () => void;
  className?: string;
}

export function TierUsageCard({ 
  tier, 
  usage, 
  limits, 
  onUpgrade, 
  className 
}: TierUsageCardProps) {
  const getUsagePercentage = (current: number, limit: number | null): number => {
    if (limit === null) return 0; // unlimited
    return Math.round((current / limit) * 100);
  };

  const getUsageStatus = (current: number, limit: number | null) => {
    if (limit === null) return { icon: Infinity, color: 'text-green-600', text: 'Unlimited' };
    
    const percentage = getUsagePercentage(current, limit);
    if (percentage >= 90) return { icon: AlertTriangle, color: 'text-red-600', text: 'Critical' };
    if (percentage >= 75) return { icon: AlertTriangle, color: 'text-yellow-600', text: 'Warning' };
    return { icon: CheckCircle, color: 'text-green-600', text: 'Good' };
  };

  const stylistStatus = getUsageStatus(usage.stylists, limits.stylists);
  const serviceStatus = getUsageStatus(usage.services, limits.services);
  const appointmentStatus = getUsageStatus(usage.appointmentsToday, limits.appointmentsPerDay);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getTierDisplayName(tier)} Plan
              <Badge variant={tier === 'enterprise' ? 'default' : 'secondary'}>
                {tier}
              </Badge>
            </CardTitle>
            <CardDescription>
              Usage statistics and limits for your current plan
            </CardDescription>
          </div>
          {onUpgrade && tier !== 'enterprise' && (
            <Button onClick={onUpgrade} size="sm">
              Upgrade
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stylists Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <stylistStatus.icon className={`h-4 w-4 ${stylistStatus.color}`} />
              <span className="font-medium">Stylists</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {usage.stylists} / {limits.stylists === null ? '∞' : limits.stylists}
            </div>
          </div>
          {limits.stylists !== null && (
            <Progress 
              value={getUsagePercentage(usage.stylists, limits.stylists)} 
              className="h-2"
            />
          )}
          {usage.stylists >= (limits.stylists || 0) && limits.stylists !== null && (
            <p className="text-xs text-red-600">
              {getUpgradeMessage(tier, 'stylists')}
            </p>
          )}
        </div>

        {/* Services Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <serviceStatus.icon className={`h-4 w-4 ${serviceStatus.color}`} />
              <span className="font-medium">Services</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {usage.services} / {limits.services === null ? '∞' : limits.services}
            </div>
          </div>
          {limits.services !== null && (
            <Progress 
              value={getUsagePercentage(usage.services, limits.services)} 
              className="h-2"
            />
          )}
          {usage.services >= (limits.services || 0) && limits.services !== null && (
            <p className="text-xs text-red-600">
              {getUpgradeMessage(tier, 'services')}
            </p>
          )}
        </div>

        {/* Appointments Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <appointmentStatus.icon className={`h-4 w-4 ${appointmentStatus.color}`} />
              <span className="font-medium">Appointments Today</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {usage.appointmentsToday} / {limits.appointmentsPerDay === null ? '∞' : limits.appointmentsPerDay}
            </div>
          </div>
          {limits.appointmentsPerDay !== null && (
            <Progress 
              value={getUsagePercentage(usage.appointmentsToday, limits.appointmentsPerDay)} 
              className="h-2"
            />
          )}
          {usage.appointmentsToday >= (limits.appointmentsPerDay || 0) && limits.appointmentsPerDay !== null && (
            <p className="text-xs text-red-600">
              {getUpgradeMessage(tier, 'appointmentsPerDay')}
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Status:</span>
            <Badge 
              variant={
                stylistStatus.text === 'Critical' || serviceStatus.text === 'Critical' || appointmentStatus.text === 'Critical'
                  ? 'destructive'
                  : stylistStatus.text === 'Warning' || serviceStatus.text === 'Warning' || appointmentStatus.text === 'Warning'
                  ? 'secondary'
                  : 'default'
              }
            >
              {stylistStatus.text === 'Critical' || serviceStatus.text === 'Critical' || appointmentStatus.text === 'Critical'
                ? 'Critical'
                : stylistStatus.text === 'Warning' || serviceStatus.text === 'Warning' || appointmentStatus.text === 'Warning'
                ? 'Warning'
                : 'Healthy'
              }
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 