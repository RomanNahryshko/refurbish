// Subscription types for future implementation
// This file is a placeholder for when subscription features are added

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export interface Subscription {
  id: string
  user_id: string
  tier: SubscriptionTier
  status: 'active' | 'cancelled' | 'expired' | 'trial'
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at?: string
}

export interface Feature {
  name: string
  description: string
  tier_required: SubscriptionTier
  enabled: boolean
}

export interface SubscriptionLimits {
  max_phones_per_batch: number
  max_users: number
  max_monthly_repairs: number
  advanced_analytics: boolean
  api_access: boolean
} 