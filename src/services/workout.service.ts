import { supabase } from '../lib/supabase';

/**
 * Fetch the most recent workout plan for a client
 */
export async function getWorkoutPlan(clientId: string) {
  return supabase
    .from('workout_plans')
    .select('id')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);
}

/**
 * Fetch daily workout for a specific day of the week
 */
export async function getDailyWorkout(workoutPlanId: string, dayOfWeek: number) {
  return supabase
    .from('daily_workouts')
    .select('*')
    .eq('workout_plan_id', workoutPlanId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();
}

/**
 * Fetch exercises for a daily workout
 */
export async function getExercises(dailyWorkoutId: string) {
  return supabase
    .from('exercises')
    .select('*')
    .eq('daily_workout_id', dailyWorkoutId)
    .order('order_index');
}

/**
 * Fetch exercise logs for a client (most recent first)
 */
export async function getExerciseLogs(clientId: string, exerciseIds: string[]) {
  return supabase
    .from('exercise_logs')
    .select('*')
    .eq('client_id', clientId)
    .in('exercise_id', exerciseIds)
    .order('date', { ascending: false });
}

/**
 * Upsert an exercise log (create or update for today)
 */
export async function upsertExerciseLog(
  clientId: string,
  exerciseId: string,
  dailyWorkoutId: string,
  date: string,
  setsCompleted: Array<{ set: number; weight: number; reps: number }>
) {
  const { data: existing } = await supabase
    .from('exercise_logs')
    .select('id')
    .eq('client_id', clientId)
    .eq('exercise_id', exerciseId)
    .eq('date', date)
    .maybeSingle();

  if (existing) {
    return supabase
      .from('exercise_logs')
      .update({ sets_completed: setsCompleted })
      .eq('id', existing.id);
  }

  return supabase.from('exercise_logs').insert({
    client_id: clientId,
    exercise_id: exerciseId,
    daily_workout_id: dailyWorkoutId,
    date,
    sets_completed: setsCompleted,
  });
}
