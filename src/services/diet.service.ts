import { supabase } from '../lib/supabase';

/**
 * Fetch all diet plans for a client (list view)
 */
export async function getClientDietPlans(clientId: string) {
  return supabase
    .from('diet_plans')
    .select('*')
    .eq('client_id', clientId)
    .order('display_order')
    .order('created_at');
}

/**
 * Fetch a single diet plan with all nested relations (meals, foods, substitutions)
 */
export async function getDietPlanWithMeals(dietPlanId: string) {
  return supabase
    .from('diet_plans')
    .select(`
      *,
      meals (
        *,
        meal_foods (*),
        meal_substitutions (*)
      ),
      food_substitutions (*)
    `)
    .eq('id', dietPlanId)
    .single();
}

/**
 * Fetch extra meals for a client on a given date
 */
export async function getExtraMeals(clientId: string, date: string) {
  return supabase
    .from('extra_meals')
    .select('*, extra_meal_foods(*)')
    .eq('client_id', clientId)
    .eq('date', date)
    .order('created_at');
}

/**
 * Create an extra meal with its foods
 */
export async function createExtraMeal(
  clientId: string,
  date: string,
  mealName: string,
  foods: Array<{
    food_id: number | null;
    food_name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }>
) {
  const { data: meal, error: mealError } = await supabase
    .from('extra_meals')
    .insert({ client_id: clientId, date, meal_name: mealName })
    .select()
    .single();

  if (mealError || !meal) {
    return { data: null, error: mealError };
  }

  const foodsToInsert = foods.map(food => ({
    extra_meal_id: meal.id,
    ...food,
  }));

  const { error: foodsError } = await supabase
    .from('extra_meal_foods')
    .insert(foodsToInsert);

  if (foodsError) {
    // Rollback: delete the meal
    await supabase.from('extra_meals').delete().eq('id', meal.id);
    return { data: null, error: foodsError };
  }

  return { data: meal, error: null };
}

/**
 * Delete an extra meal
 */
export async function deleteExtraMeal(mealId: string) {
  return supabase.from('extra_meals').delete().eq('id', mealId);
}

/**
 * Fetch food equivalence groups
 */
export async function getEquivalenceGroups() {
  return supabase
    .from('food_equivalence_groups')
    .select('*')
    .order('name');
}

/**
 * Fetch food equivalences
 */
export async function getFoodEquivalences() {
  return supabase
    .from('food_equivalences')
    .select('*')
    .order('order_index');
}
