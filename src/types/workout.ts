export interface WorkoutPlan {
  id: string;
  client_id: string;
  created_at: string;
  updated_at: string;
}

export interface DailyWorkout {
  id: string;
  workout_plan_id: string;
  day_of_week: number;
  workout_type: string | null;
}

export interface Exercise {
  id: string;
  daily_workout_id: string;
  name: string;
  sets: number | null;
  reps: string | null;
  rest: string | null;
  weight_kg: number | null;
  video_url: string | null;
  notes: string | null;
  order_index: number;
  technique_id: string | null;
  effort_parameter_id: string | null;
}

export interface ExerciseLibrary {
  id: string;
  name: string;
  video_url: string | null;
  muscle_group: string | null;
  description: string | null;
  created_at: string;
}
