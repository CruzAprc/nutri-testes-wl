import type { UnitType } from './common';

export interface DietPlan {
  id: string;
  client_id: string;
  name: string;
  display_order: number;
  daily_calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  water_goal_liters: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  diet_plan_id: string;
  name: string;
  suggested_time: string | null;
  order_index: number;
  meal_substitutions?: MealSubstitution[];
}

export interface MealFood {
  id: string;
  meal_id: string;
  food_name: string;
  quantity: string;
  quantity_units: number | null;
  unit_type: UnitType;
  order_index: number;
}

export interface FoodSubstitution {
  id: string;
  diet_plan_id: string;
  original_food: string;
  substitute_food: string;
  substitute_quantity: string;
}

export interface TemplateFoodSubstitution {
  id: string;
  template_food_id: string;
  substitute_food: string;
  substitute_quantity: string;
}

export interface MealSubstitutionItem {
  food_name: string;
  quantity: string;
  unit_type: UnitType;
  quantity_units: number | null;
}

export interface MealSubstitution {
  id: string;
  name: string;
  items: MealSubstitutionItem[];
}

export interface FoodEquivalenceGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface FoodEquivalence {
  id: string;
  group_id: string;
  food_name: string;
  quantity_grams: number;
  order_index: number;
  created_at: string;
}
