export interface TProfile {
  name: string;
  id: string;
  phone: string;
  email: string;
  role: string;
  profile_picture: string;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;

  subscription: {
    plan: "basic" | "premium" | "enterprise";
    features: {
      stylists: {
        allowed: number;
        unlimited: boolean;
      };
      appointments: {
        daily_limit: number;
        unlimited: boolean;
        real_time_updates: boolean;
        priority_queue: boolean;
        ai_optimization: boolean;
      };
      hairstyles: {
        predefined_limit: number;
        custom_uploads: boolean;
        full_library: boolean;
      };
      profile: {
        basic_listing: boolean;
        reviews_visible: boolean;
      };
      analytics: {
        basic: boolean;
        intermediate: boolean;
        advanced: boolean;
      };
      communication: {
        in_app_messaging: boolean;
        priority_support: boolean;
      };
      marketing: {
        push_notifications: boolean;
      };
    };
    active: boolean;
    start_date: string | null;
    billing_cycle: "monthly" | "yearly" | null;
  } | null;
}
