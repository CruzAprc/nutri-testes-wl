import { supabase } from '../lib/supabase';

/**
 * Fetch a user profile by ID
 */
export async function getProfile(userId: string) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
}

/**
 * Fetch all client profiles (for admin list)
 */
export async function getClients() {
  return supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('full_name');
}

/**
 * Update a user profile
 */
export async function updateProfile(userId: string, data: Record<string, unknown>) {
  return supabase
    .from('profiles')
    .update(data)
    .eq('id', userId);
}

/**
 * Fetch clients with expiring plans (within N days)
 */
export async function getExpiringClients(startDate: string, endDate: string) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .gte('plan_end_date', startDate)
    .lte('plan_end_date', endDate)
    .order('plan_end_date');
}

/**
 * Fetch weight history for a client
 */
export async function getWeightHistory(clientId: string, limit = 10) {
  return supabase
    .from('weight_history')
    .select('*')
    .eq('client_id', clientId)
    .order('recorded_at', { ascending: false })
    .limit(limit);
}

/**
 * Upsert weight record for today
 */
export async function upsertWeightRecord(
  clientId: string,
  weightKg: number,
  todayStart: string,
  todayEnd: string
) {
  const { data: existing } = await supabase
    .from('weight_history')
    .select('id')
    .eq('client_id', clientId)
    .gte('recorded_at', todayStart)
    .lt('recorded_at', todayEnd)
    .maybeSingle();

  if (existing) {
    return supabase
      .from('weight_history')
      .update({ weight_kg: weightKg })
      .eq('id', existing.id);
  }

  return supabase.from('weight_history').insert({
    client_id: clientId,
    weight_kg: weightKg,
  });
}
