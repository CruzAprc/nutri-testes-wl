import { supabase } from '../lib/supabase';
import type { DailyProgress } from '../types/database';

/**
 * Fetch today's daily progress for a client
 */
export async function getDailyProgress(clientId: string, date: string) {
  return supabase
    .from('daily_progress')
    .select('*')
    .eq('client_id', clientId)
    .eq('date', date)
    .maybeSingle();
}

/**
 * Fetch weekly progress records for a client
 */
export async function getWeeklyProgress(clientId: string, startDate: string, endDate: string) {
  return supabase
    .from('daily_progress')
    .select('*')
    .eq('client_id', clientId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');
}

/**
 * Upsert meal completion (toggle a meal as completed/uncompleted)
 */
export async function upsertMealCompletion(clientId: string, date: string, mealsCompleted: string[]) {
  const { data: existing } = await supabase
    .from('daily_progress')
    .select('id')
    .eq('client_id', clientId)
    .eq('date', date)
    .maybeSingle();

  if (existing) {
    return supabase
      .from('daily_progress')
      .update({ meals_completed: mealsCompleted })
      .eq('id', existing.id);
  }

  return supabase.from('daily_progress').insert({
    client_id: clientId,
    date,
    meals_completed: mealsCompleted,
    exercises_completed: [],
    water_consumed_ml: 0,
  });
}

/**
 * Upsert exercise completion (toggle an exercise as completed/uncompleted)
 */
export async function upsertExerciseCompletion(clientId: string, date: string, exercisesCompleted: string[]) {
  const { data: existing } = await supabase
    .from('daily_progress')
    .select('id')
    .eq('client_id', clientId)
    .eq('date', date)
    .maybeSingle();

  if (existing) {
    return supabase
      .from('daily_progress')
      .update({ exercises_completed: exercisesCompleted })
      .eq('id', existing.id);
  }

  return supabase.from('daily_progress').insert({
    client_id: clientId,
    date,
    exercises_completed: exercisesCompleted,
    meals_completed: [],
    water_consumed_ml: 0,
  });
}

/**
 * Update water consumption for a given day
 */
export async function upsertWaterConsumption(clientId: string, date: string, waterConsumedMl: number) {
  const { data: updated } = await supabase
    .from('daily_progress')
    .update({ water_consumed_ml: waterConsumedMl })
    .eq('client_id', clientId)
    .eq('date', date)
    .select('id')
    .maybeSingle();

  if (!updated) {
    return supabase.from('daily_progress').insert({
      client_id: clientId,
      date,
      water_consumed_ml: waterConsumedMl,
      exercises_completed: [],
      meals_completed: [],
    });
  }

  return { data: updated, error: null };
}
