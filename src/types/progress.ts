export interface DailyProgress {
  id: string;
  client_id: string;
  date: string;
  exercises_completed: string[];
  meals_completed: string[];
  water_consumed_ml: number;
  created_at: string;
}

export interface WeightHistory {
  id: string;
  client_id: string;
  weight_kg: number;
  recorded_at: string;
}

export interface ExerciseLogSet {
  set: number;
  weight: number;
  reps: number;
}

export interface ProgressPhoto {
  id: string;
  client_id: string;
  photo_url: string;
  photo_type: 'front' | 'side' | 'back';
  taken_at: string;
  created_at: string;
}

export interface ExerciseLogRecord {
  id: string;
  client_id: string;
  exercise_id: string;
  daily_workout_id: string;
  date: string;
  sets_completed: ExerciseLogSet[];
  created_at: string;
}
