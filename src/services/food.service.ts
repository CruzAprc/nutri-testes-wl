import { supabase } from '../lib/supabase';

/**
 * Search foods in the TACO table with metadata
 */
export async function searchFoodsWithMetadata(searchTerm: string) {
  return supabase
    .from('tabela_taco')
    .select(`
      *,
      food_metadata (
        id,
        taco_id,
        nome_simplificado,
        unidade_tipo,
        peso_por_unidade,
        created_at,
        updated_at
      )
    `)
    .ilike('alimento', `%${searchTerm}%`)
    .limit(30);
}

/**
 * Search simplified food names in food_metadata
 */
export async function searchFoodsBySimplifiedName(searchTerm: string) {
  return supabase
    .from('food_metadata')
    .select('taco_id')
    .ilike('nome_simplificado', `%${searchTerm}%`)
    .limit(30);
}

/**
 * Fetch foods by IDs with metadata
 */
export async function getFoodsByIds(ids: number[]) {
  return supabase
    .from('tabela_taco')
    .select(`
      *,
      food_metadata (
        id,
        taco_id,
        nome_simplificado,
        unidade_tipo,
        peso_por_unidade,
        created_at,
        updated_at
      )
    `)
    .in('id', ids);
}

/**
 * Fetch nutrition data for specific foods by name
 */
export async function getFoodNutrition(foodNames: string[]) {
  return supabase
    .from('tabela_taco')
    .select(`
      *,
      food_metadata (
        id,
        taco_id,
        nome_simplificado,
        unidade_tipo,
        peso_por_unidade,
        created_at,
        updated_at
      )
    `)
    .in('alimento', foodNames);
}

/**
 * Search foods in TACO table (simple, no metadata)
 */
export async function searchFoods(searchTerm: string, limit = 30) {
  return supabase
    .from('tabela_taco')
    .select('*')
    .ilike('alimento', `%${searchTerm}%`)
    .order('alimento', { ascending: true })
    .limit(limit);
}
