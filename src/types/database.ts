// Re-export hub - all types available from this file for backward compatibility
export type { UserRole, HealthRating, UnitType, DigestionRating, BowelFrequency, SleepQuality } from './common';
export type { AppSettings } from './app-settings';
export { DEFAULT_APP_SETTINGS } from './app-settings';
export type { Profile, Anamnesis } from './profile';
export type { DietPlan, Meal, MealFood, FoodSubstitution, TemplateFoodSubstitution, MealSubstitutionItem, MealSubstitution, FoodEquivalenceGroup, FoodEquivalence } from './diet';
export type { WorkoutPlan, DailyWorkout, Exercise, ExerciseLibrary } from './workout';
export type { DailyProgress, WeightHistory, ExerciseLogSet, ExerciseLogRecord } from './progress';
export type { TabelaTaco, FoodMetadata, TabelaTacoWithMetadata, ExtraMeal, ExtraMealFood, ExtraMealWithFoods } from './food';
export type { PaymentGateway, PaymentMethod, PaymentStatus, AsaasEnvironment, PaymentSettings, SubscriptionPlan, Payment, PaymentWithPlan } from './payment';

import type { Profile, Anamnesis } from './profile';
import type { DietPlan, Meal, MealFood, FoodSubstitution } from './diet';
import type { WorkoutPlan, DailyWorkout, Exercise, ExerciseLibrary } from './workout';
import type { DailyProgress, WeightHistory, ExerciseLogRecord } from './progress';
import type { TabelaTaco, FoodMetadata, ExtraMeal, ExtraMealFood } from './food';
import type { PaymentSettings, SubscriptionPlan, Payment } from './payment';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      anamnesis: {
        Row: Anamnesis;
        Insert: Omit<Anamnesis, 'id' | 'updated_at'>;
        Update: Partial<Omit<Anamnesis, 'id'>>;
      };
      diet_plans: {
        Row: DietPlan;
        Insert: Omit<DietPlan, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DietPlan, 'id'>>;
      };
      meals: {
        Row: Meal;
        Insert: Omit<Meal, 'id'>;
        Update: Partial<Omit<Meal, 'id'>>;
      };
      meal_foods: {
        Row: MealFood;
        Insert: Omit<MealFood, 'id'>;
        Update: Partial<Omit<MealFood, 'id'>>;
      };
      food_substitutions: {
        Row: FoodSubstitution;
        Insert: Omit<FoodSubstitution, 'id'>;
        Update: Partial<Omit<FoodSubstitution, 'id'>>;
      };
      workout_plans: {
        Row: WorkoutPlan;
        Insert: Omit<WorkoutPlan, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WorkoutPlan, 'id'>>;
      };
      daily_workouts: {
        Row: DailyWorkout;
        Insert: Omit<DailyWorkout, 'id'>;
        Update: Partial<Omit<DailyWorkout, 'id'>>;
      };
      exercises: {
        Row: Exercise;
        Insert: Omit<Exercise, 'id'>;
        Update: Partial<Omit<Exercise, 'id'>>;
      };
      exercise_library: {
        Row: ExerciseLibrary;
        Insert: Omit<ExerciseLibrary, 'id' | 'created_at'>;
        Update: Partial<Omit<ExerciseLibrary, 'id'>>;
      };
      daily_progress: {
        Row: DailyProgress;
        Insert: Omit<DailyProgress, 'id' | 'created_at'>;
        Update: Partial<Omit<DailyProgress, 'id'>>;
      };
      weight_history: {
        Row: WeightHistory;
        Insert: Omit<WeightHistory, 'id' | 'recorded_at'>;
        Update: Partial<Omit<WeightHistory, 'id'>>;
      };
      tabela_taco: {
        Row: TabelaTaco;
        Insert: Omit<TabelaTaco, 'id' | 'created_at'>;
        Update: Partial<Omit<TabelaTaco, 'id'>>;
      };
      food_metadata: {
        Row: FoodMetadata;
        Insert: Omit<FoodMetadata, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<FoodMetadata, 'id'>>;
      };
      extra_meals: {
        Row: ExtraMeal;
        Insert: Omit<ExtraMeal, 'id' | 'created_at'>;
        Update: Partial<Omit<ExtraMeal, 'id'>>;
      };
      extra_meal_foods: {
        Row: ExtraMealFood;
        Insert: Omit<ExtraMealFood, 'id'>;
        Update: Partial<Omit<ExtraMealFood, 'id'>>;
      };
      exercise_logs: {
        Row: ExerciseLogRecord;
        Insert: Omit<ExerciseLogRecord, 'id' | 'created_at'>;
        Update: Partial<Omit<ExerciseLogRecord, 'id'>>;
      };
      payment_settings: {
        Row: PaymentSettings;
        Insert: Omit<PaymentSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PaymentSettings, 'id'>>;
      };
      subscription_plans: {
        Row: SubscriptionPlan;
        Insert: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SubscriptionPlan, 'id'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Payment, 'id'>>;
      };
    };
  };
}
