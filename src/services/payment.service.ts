import { supabase } from '../lib/supabase';

/**
 * Fetch payment settings for an owner
 */
export async function getPaymentSettings(ownerId: string) {
  return supabase
    .from('payment_settings')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();
}

/**
 * Upsert payment settings
 */
export async function upsertPaymentSettings(ownerId: string, settings: Record<string, unknown>) {
  const { data: existing } = await supabase
    .from('payment_settings')
    .select('id')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (existing) {
    return supabase
      .from('payment_settings')
      .update(settings)
      .eq('owner_id', ownerId);
  }

  return supabase
    .from('payment_settings')
    .insert({ ...settings, owner_id: ownerId });
}

/**
 * Fetch payments with related plan and client info (for financial dashboard)
 */
export async function getPayments(ownerId: string, limit = 100) {
  return supabase
    .from('payments')
    .select(`
      *,
      plan:subscription_plans(name, duration_days),
      client:profiles!payments_client_id_fkey(full_name, email)
    `)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(limit);
}

/**
 * Fetch subscription plans for an owner
 */
export async function getSubscriptionPlans(ownerId: string) {
  return supabase
    .from('subscription_plans')
    .select('*')
    .eq('owner_id', ownerId)
    .order('display_order');
}

/**
 * Find checkout link for plan expiration screens
 */
export async function findCheckoutSlug() {
  return supabase
    .from('payment_settings')
    .select('checkout_slug')
    .neq('active_gateway', 'none')
    .not('checkout_slug', 'is', null)
    .limit(1)
    .maybeSingle();
}
