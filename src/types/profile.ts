import type { UserRole, HealthRating, DigestionRating, BowelFrequency, SleepQuality } from './common';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  starting_weight_kg: number | null;
  goal_weight_kg: number | null;
  age: number | null;
  coaching_start_date: string | null;
  plan_start_date: string | null;
  plan_end_date: string | null;
  goals: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  protein_goal: number | null;
  carbs_goal: number | null;
  fats_goal: number | null;
  calories_goal: number | null;
  fiber_goal: number | null;
}

export interface Anamnesis {
  id: string;
  client_id: string;
  meals_per_day: number | null;
  water_liters_per_day: number | null;
  meal_times: Record<string, string> | null;
  meals_prepared_same_day: boolean | null;
  preferred_foods: string | null;
  disliked_foods: string | null;
  supplements: string | null;
  food_allergies: string | null;
  gluten_intolerance: boolean;
  alcohol_consumption: string | null;
  current_exercise_type: string | null;
  exercise_duration: string | null;
  routine_exercises: string | null;
  weekly_routine: Record<string, string> | null;
  health_rating: HealthRating | null;
  smoker: boolean;
  cigarettes_per_day: number | null;
  digestion: DigestionRating | null;
  bowel_frequency: BowelFrequency | null;
  medications: string | null;
  bedtime: string | null;
  wakeup_time: string | null;
  sleep_quality: SleepQuality | null;
  sleep_hours: number | null;
  diseases: string | null;
  family_history: string | null;
  updated_at: string;
}
