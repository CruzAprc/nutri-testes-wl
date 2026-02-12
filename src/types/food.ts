import type { UnitType } from './common';

export interface TabelaTaco {
  id: number;
  created_at: string;
  alimento: string;
  caloria: string;
  proteina: string;
  carboidrato: string;
  gordura: string;
  fibra: string;
}

export interface FoodMetadata {
  id: string;
  taco_id: number;
  nome_simplificado: string;
  unidade_tipo: UnitType;
  peso_por_unidade: number | null;
  created_at: string;
  updated_at: string;
}

export interface TabelaTacoWithMetadata extends TabelaTaco {
  food_metadata?: FoodMetadata | null;
}

export interface ExtraMeal {
  id: string;
  client_id: string;
  date: string;
  meal_name: string;
  created_at: string;
}

export interface ExtraMealFood {
  id: string;
  extra_meal_id: string;
  food_id: number | null;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface ExtraMealWithFoods extends ExtraMeal {
  foods: ExtraMealFood[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
}
