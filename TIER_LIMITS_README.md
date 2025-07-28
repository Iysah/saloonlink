# Tier-Based Limits Implementation

This document describes the implementation of tier-based limits for the salon booking system, including stylist limits, service limits, and appointment limits.

## Overview

The system enforces limits based on subscription tiers:
- **Free**: 1 stylist, 5 services, 5 appointments/day
- **Starter**: 2 stylists, 10 services, 10 appointments/day  
- **Pro**: 5 stylists, unlimited services, unlimited appointments
- **Enterprise**: Unlimited stylists, unlimited services, unlimited appointments

## Database Implementation

### Migration Files

1. **`supabase/migrations/20250120000000_tier_limits.sql`** - Main migration file containing:
   - Triggers for enforcing stylist and service limits
   - Helper functions for getting tier information
   - Usage statistics functions
   - Performance indexes

### Key Database Functions

#### `check_stylist_limit()`
- Trigger function that enforces stylist limits per salon
- Prevents adding stylists beyond tier limits
- Throws descriptive error messages

#### `check_service_limit()`
- Trigger function that enforces service limits per barber
- Prevents adding services beyond tier limits
- Throws descriptive error messages

#### `get_usage_stats(barber_user_id)`
- Returns current usage statistics for a barber
- Includes stylist count, service count, and daily appointments
- Returns tier information and limits

#### `get_tier_limits(tier_name)`
- Returns limit configuration for any tier
- Useful for frontend validation and display

### Database Schema Changes

- Added `deleted_at` columns to `barber_profiles` and `services` tables for soft deletes
- Created indexes for better performance on limit checks
- Added triggers to enforce limits at the database level

## Frontend Implementation

### Core Files

1. **`lib/tierLimits.ts`** - TypeScript utilities and constants
2. **`hooks/useTierLimits.ts`** - React hooks for tier management
3. **`components/ui/tier-usage-card.tsx`** - UI component for displaying usage
4. **`components/barber/tier-dashboard.tsx`** - Example dashboard integration

### Key Features

#### TypeScript Utilities (`lib/tierLimits.ts`)
```typescript
// Check if user can add stylists
const canAdd = canAddStylist(currentCount, tier);

// Get upgrade message
const message = getUpgradeMessage('free', 'stylists');

// Validate limits
const validation = validateStylistCount(count, tier);
```

#### React Hooks (`hooks/useTierLimits.ts`)
```typescript
// Get tier information and usage
const { tierInfo, loading, error } = useTierLimits(userId);

// Check specific actions
const { canAddStylist, canAddService } = useTierActions(userId);
```

#### UI Components
```typescript
// Display usage card
<TierUsageCard
  tier={tierInfo.tier}
  usage={tierInfo.usage}
  limits={tierInfo.limits}
  onUpgrade={handleUpgrade}
/>

// Dashboard integration
<BarberTierDashboard
  userId={userId}
  onAddStylist={handleAddStylist}
  onAddService={handleAddService}
  onUpgrade={handleUpgrade}
/>
```

## Usage Examples

### 1. Adding a New Stylist

```typescript
import { useTierActions } from '@/hooks/useTierLimits';

function AddStylistForm() {
  const { canAddStylist } = useTierActions(userId);
  
  const handleSubmit = async (data: StylistData) => {
    if (!canAddStylist()) {
      toast.error('Stylist limit reached. Please upgrade your plan.');
      return;
    }
    
    // Proceed with adding stylist
    await addStylist(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <Button disabled={!canAddStylist()}>
        Add Stylist
      </Button>
    </form>
  );
}
```

### 2. Adding a New Service

```typescript
import { useTierActions } from '@/hooks/useTierLimits';

function AddServiceForm() {
  const { canAddService } = useTierActions(userId);
  
  const handleSubmit = async (data: ServiceData) => {
    if (!canAddService()) {
      toast.error('Service limit reached. Please upgrade your plan.');
      return;
    }
    
    // Proceed with adding service
    await addService(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <Button disabled={!canAddService()}>
        Add Service
      </Button>
    </form>
  );
}
```

### 3. Displaying Usage Dashboard

```typescript
import { BarberTierDashboard } from '@/components/barber/tier-dashboard';

function BarberDashboard() {
  const handleUpgrade = () => {
    // Navigate to pricing page
    router.push('/pricing');
  };
  
  return (
    <div>
      <h1>Dashboard</h1>
      <BarberTierDashboard
        userId={userId}
        onUpgrade={handleUpgrade}
        onAddStylist={() => setShowAddStylist(true)}
        onAddService={() => setShowAddService(true)}
      />
    </div>
  );
}
```

## Error Handling

### Database Level
- Triggers throw descriptive exceptions when limits are exceeded
- Error messages include current tier and suggested upgrade path

### Application Level
- Frontend validation prevents form submission when limits are reached
- Toast notifications inform users about limit restrictions
- Upgrade prompts guide users to higher tiers

## Testing

### Database Tests
```sql
-- Test stylist limit
INSERT INTO barber_profiles (user_id, salon_id, tier) 
VALUES ('user1', 'salon1', 'free');

-- This should fail
INSERT INTO barber_profiles (user_id, salon_id, tier) 
VALUES ('user2', 'salon1', 'free');

-- Test service limit
INSERT INTO services (barber_id, service_name, price) 
VALUES ('user1', 'Service 1', 10.00);
-- Repeat until limit is reached
```

### Frontend Tests
```typescript
import { canAddStylist, validateStylistCount } from '@/lib/tierLimits';

test('should allow adding stylist within limit', () => {
  expect(canAddStylist(0, 'free')).toBe(true);
  expect(canAddStylist(1, 'free')).toBe(false);
});

test('should validate stylist count', () => {
  const result = validateStylistCount(1, 'free');
  expect(result.isValid).toBe(false);
  expect(result.message).toContain('limit of 1 stylist');
});
```

## Migration and Deployment

1. **Run the migration**:
   ```bash
   supabase db push
   ```

2. **Update existing data** (if needed):
   ```sql
   -- Set default tier for existing barbers
   UPDATE barber_profiles 
   SET tier = 'free' 
   WHERE tier IS NULL;
   ```

3. **Deploy frontend changes**:
   ```bash
   npm run build
   npm run deploy
   ```

## Monitoring and Analytics

### Usage Tracking
- Database functions provide real-time usage statistics
- Frontend components display usage percentages
- Visual indicators show when limits are approaching

### Upgrade Funnel
- Track users who hit limits
- Monitor upgrade conversion rates
- Analyze feature usage by tier

## Future Enhancements

1. **Dynamic Limits**: Allow admins to customize limits per user
2. **Usage Analytics**: Detailed reports on feature usage
3. **Trial Periods**: Temporary limit increases for new users
4. **Bulk Operations**: Handle multiple stylists/services at once
5. **API Rate Limiting**: Enforce limits at the API level

## Support

For questions or issues with tier limits:
1. Check the database logs for trigger errors
2. Verify tier configuration in `lib/tierLimits.ts`
3. Test with the provided examples
4. Contact the development team for assistance 