import { useEffect, useLayoutEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Clock, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { getMealImage } from '../../utils/mealImages';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { usePageData } from '../../hooks';
import { PageContainer, Header, BottomNav } from '../../components/layout';
import { Card, Checkbox, Button } from '../../components/ui';
import { DailyMacrosSummary } from '../../components/diet/DailyMacrosSummary';
import { AddExtraMealModal } from '../../components/diet/AddExtraMealModal';
import { MealDetailSheet } from '../../components/diet/MealDetailSheet';
import type { ExtraMeal } from '../../components/diet/AddExtraMealModal';
import { parseBrazilianNumber } from '../../utils/parsers';
import { getBrasiliaDate } from '../../utils/date';
import type { Meal, MealFood, FoodSubstitution, UnitType, FoodEquivalenceGroup, FoodEquivalence, DietPlan, MealSubstitution, MealSubstitutionItem } from '../../types/database';
import styles from './Diet.module.css';

// Helper para salvar/carregar dieta selecionada do localStorage
const SELECTED_DIET_KEY = 'selectedDietId';
function getStoredDietId(): string | null {
  try {
    return localStorage.getItem(SELECTED_DIET_KEY);
  } catch {
    return null;
  }
}
function setStoredDietId(dietId: string): void {
  try {
    localStorage.setItem(SELECTED_DIET_KEY, dietId);
  } catch {
    // Ignore localStorage errors
  }
}

// Tipo para agrupar equivalencias por grupo
export interface EquivalenceGroupWithFoods extends FoodEquivalenceGroup {
  foods: FoodEquivalence[];
}

export interface MealFoodWithNutrition extends MealFood {
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  display_name?: string; // Nome simplificado para exibicao
}

// Substitution item with nutrition data
export interface MealSubstitutionItemWithNutrition extends MealSubstitutionItem {
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  display_name?: string;
}

// Substitution with calculated totals
export interface MealSubstitutionWithNutrition extends Omit<MealSubstitution, 'items'> {
  items: MealSubstitutionItemWithNutrition[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export interface MealWithNutrition extends Meal {
  foods: MealFoodWithNutrition[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  meal_substitutions_with_nutrition?: MealSubstitutionWithNutrition[];
}

// Retorna a data formatada para exibição no header
function getBrasiliaDisplayDate(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
}

export function Diet() {
  const { profile } = useAuth();
  const [meals, setMeals] = useState<MealWithNutrition[]>([]);
  const [completedMeals, setCompletedMeals] = useState<string[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealWithNutrition | null>(null);
  const [substitutions, setSubstitutions] = useState<FoodSubstitution[]>([]);
  const [currentDate, setCurrentDate] = useState(getBrasiliaDate());
  const currentDateRef = useRef(currentDate);
  const [extraMeals, setExtraMeals] = useState<ExtraMeal[]>([]);
  const [showAddExtraMeal, setShowAddExtraMeal] = useState(false);
  const [equivalenceGroups, setEquivalenceGroups] = useState<EquivalenceGroupWithFoods[]>([]);
  // Track which meal option (0 = original, 1+ = substitution index) is selected for each meal
  const [selectedMealOptions, setSelectedMealOptions] = useState<Record<string, number>>({});

  // Multiple diets support
  const [availableDiets, setAvailableDiets] = useState<DietPlan[]>([]);
  const [selectedDietId, setSelectedDietId] = useState<string | null>(getStoredDietId());

  // Carregar dados do cache ANTES do paint (useLayoutEffect elimina flash)
  useLayoutEffect(() => {
    if (!profile?.id) return;
    try {
      const cached = localStorage.getItem(`diet_cache_${profile.id}`);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.meals?.length > 0) setMeals(data.meals);
        if (data.substitutions) setSubstitutions(data.substitutions);
        if (data.availableDiets) setAvailableDiets(data.availableDiets);
        if (data.equivalenceGroups) setEquivalenceGroups(data.equivalenceGroups);
      }
    } catch {
      // Cache inválido, ignorar
    }
  }, [profile?.id]);

  // Salvar cache quando dados mudam
  useEffect(() => {
    if (!profile?.id || meals.length === 0) return;
    try {
      localStorage.setItem(`diet_cache_${profile.id}`, JSON.stringify({
        meals,
        substitutions,
        availableDiets,
        equivalenceGroups,
      }));
    } catch {
      // Ignore localStorage errors
    }
  }, [meals, substitutions, availableDiets, equivalenceGroups, profile?.id]);

  // Callback para buscar todos os dados
  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchDiet(), fetchProgress(), fetchEquivalences(), fetchExtraMeals()]);
  }, [profile?.id]);

  // Hook que gerencia loading e refetch automático
  const { isInitialLoading: loading } = usePageData({
    userId: profile?.id,
    fetchData: fetchAllData,
  });

  // Verificar mudança de dia a cada minuto (reset automático à meia-noite)
  useEffect(() => {
    const checkDayChange = async () => {
      const newDate = getBrasiliaDate();
      if (newDate !== currentDateRef.current) {
        currentDateRef.current = newDate;
        setCurrentDate(newDate);
        setCompletedMeals([]);
        setExtraMeals([]);
        // Buscar dados do novo dia
        await Promise.all([fetchProgress(), fetchExtraMeals()]);
      }
    };

    const interval = setInterval(checkDayChange, 60000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  // Calcular macros totais planejados
  const totalPlannedMacros = useMemo(() => {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totalCalories,
        protein: acc.protein + meal.totalProtein,
        carbs: acc.carbs + meal.totalCarbs,
        fats: acc.fats + meal.totalFats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [meals]);

  // Calcular macros consumidos (refeições marcadas + extras)
  const consumedMacros = useMemo(() => {
    // Macros das refeições planejadas que foram marcadas
    const fromPlanned = meals
      .filter((meal) => completedMeals.includes(meal.id))
      .reduce(
        (acc, meal) => ({
          calories: acc.calories + meal.totalCalories,
          protein: acc.protein + meal.totalProtein,
          carbs: acc.carbs + meal.totalCarbs,
          fats: acc.fats + meal.totalFats,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

    // Macros das refeições extras (sempre contam como consumidas)
    const fromExtras = extraMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.total_calories,
        protein: acc.protein + meal.total_protein,
        carbs: acc.carbs + meal.total_carbs,
        fats: acc.fats + meal.total_fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    return {
      calories: fromPlanned.calories + fromExtras.calories,
      protein: fromPlanned.protein + fromExtras.protein,
      carbs: fromPlanned.carbs + fromExtras.carbs,
      fats: fromPlanned.fats + fromExtras.fats,
    };
  }, [meals, completedMeals, extraMeals]);

  // Adicionar refeição extra (salva no banco de dados)
  const handleAddExtraMeal = async (meal: ExtraMeal) => {
    const today = getBrasiliaDate();

    try {
      // 1. Inserir a refeição extra
      const { data: insertedMeal, error: mealError } = await supabase
        .from('extra_meals')
        .insert({
          client_id: profile!.id,
          date: today,
          meal_name: meal.meal_name,
        })
        .select()
        .single();

      if (mealError || !insertedMeal) {
        console.error('[Diet] Error inserting extra meal:', mealError);
        return;
      }

      // 2. Inserir os alimentos da refeição
      if (meal.foods && meal.foods.length > 0) {
        const foodsToInsert = meal.foods.map((food) => ({
          extra_meal_id: insertedMeal.id,
          food_id: null, // food_id do tabela_taco se disponível
          food_name: food.name,
          quantity: food.quantity,
          unit: food.unit_type || 'gramas',
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fats: food.fats,
        }));

        const { error: foodsError } = await supabase
          .from('extra_meal_foods')
          .insert(foodsToInsert);

        if (foodsError) {
          console.error('[Diet] Error inserting extra meal foods:', foodsError);
          // Se falhar ao inserir alimentos, deletar a refeição
          await supabase.from('extra_meals').delete().eq('id', insertedMeal.id);
          return;
        }
      }

      // 3. Atualizar estado local com o ID do banco
      const newMeal: ExtraMeal = {
        ...meal,
        id: insertedMeal.id,
      };
      setExtraMeals([...extraMeals, newMeal]);
    } catch (error) {
      console.error('[Diet] Error saving extra meal:', error);
    }
  };

  // Remover refeição extra (deleta do banco de dados)
  const handleRemoveExtraMeal = async (id: string) => {
    try {
      // Deletar do banco (cascade deleta os alimentos automaticamente)
      const { error } = await supabase
        .from('extra_meals')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Diet] Error deleting extra meal:', error);
        return;
      }

      // Atualizar estado local
      setExtraMeals(extraMeals.filter((m) => m.id !== id));
    } catch (error) {
      console.error('[Diet] Error removing extra meal:', error);
    }
  };

  async function fetchDiet() {
    // 1. First, fetch all available diets for this client
    const { data: dietsData } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('client_id', profile!.id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!dietsData || dietsData.length === 0) {
      setAvailableDiets([]);
      setMeals([]);
      return;
    }

    setAvailableDiets(dietsData);

    // 2. Determine which diet to load
    let dietToLoad = dietsData[0];
    const storedDietId = getStoredDietId();

    if (storedDietId) {
      const storedDiet = dietsData.find(d => d.id === storedDietId);
      if (storedDiet) {
        dietToLoad = storedDiet;
      }
    }

    // Update selectedDietId state if needed
    if (selectedDietId !== dietToLoad.id) {
      setSelectedDietId(dietToLoad.id);
      setStoredDietId(dietToLoad.id);
    }

    // 3. Now fetch the meals for the selected diet
    const { data: dietPlanData } = await supabase
      .from('diet_plans')
      .select(`
        id,
        meals (
          id,
          name,
          suggested_time,
          order_index,
          meal_substitutions,
          meal_foods (
            id,
            food_name,
            quantity,
            order_index,
            unit_type,
            quantity_units
          )
        ),
        food_substitutions (
          id,
          diet_plan_id,
          original_food,
          substitute_food,
          substitute_quantity
        )
      `)
      .eq('id', dietToLoad.id)
      .single();

    if (!dietPlanData) {
      return;
    }

    // Extrair todos os nomes de alimentos únicos (incluindo das substituições de refeição)
    const allFoodNames = new Set<string>();
    dietPlanData.meals?.forEach((meal: any) => {
      meal.meal_foods?.forEach((food: any) => {
        if (food.food_name) {
          allFoodNames.add(food.food_name);
        }
      });
      // Também coletar alimentos das substituições de refeição
      meal.meal_substitutions?.forEach((sub: any) => {
        sub.items?.forEach((item: any) => {
          if (item.food_name) {
            allFoodNames.add(item.food_name);
          }
        });
      });
    });

    // Buscar dados nutricionais e nomes simplificados de todos os alimentos de uma vez só
    let nutritionMap = new Map<string, { caloria: string; proteina: string; carboidrato: string; gordura: string; nome_simplificado?: string; peso_por_unidade?: number }>();

    if (allFoodNames.size > 0) {
      const { data: tacoData } = await supabase
        .from('tabela_taco')
        .select(`
          alimento,
          caloria,
          proteina,
          carboidrato,
          gordura,
          food_metadata (
            nome_simplificado,
            peso_por_unidade
          )
        `)
        .in('alimento', Array.from(allFoodNames));

      if (tacoData) {
        tacoData.forEach((item: any) => {
          // food_metadata pode vir como array ou objeto dependendo da relação
          const metadata = Array.isArray(item.food_metadata)
            ? item.food_metadata[0]
            : item.food_metadata;

          nutritionMap.set(item.alimento, {
            caloria: item.caloria,
            proteina: item.proteina,
            carboidrato: item.carboidrato,
            gordura: item.gordura,
            nome_simplificado: metadata?.nome_simplificado || undefined,
            peso_por_unidade: metadata?.peso_por_unidade || undefined,
          });
        });
      }
    }

    // Processar meals com dados nutricionais
    const mealsWithNutrition: MealWithNutrition[] = (dietPlanData.meals || [])
      .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
      .map((meal: any) => {
        const foodsWithNutrition: MealFoodWithNutrition[] = (meal.meal_foods || [])
          .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
          .map((food: any) => {
            const nutrition = food.food_name ? nutritionMap.get(food.food_name) : null;

            if (nutrition) {
              const qty = parseBrazilianNumber(food.quantity);
              const multiplier = qty / 100;

              return {
                ...food,
                calories: parseBrazilianNumber(nutrition.caloria) * multiplier,
                protein: parseBrazilianNumber(nutrition.proteina) * multiplier,
                carbs: parseBrazilianNumber(nutrition.carboidrato) * multiplier,
                fats: parseBrazilianNumber(nutrition.gordura) * multiplier,
                display_name: nutrition.nome_simplificado || undefined,
              };
            }
            return food as MealFoodWithNutrition;
          });

        // Calcular totais da refeição
        const totals = foodsWithNutrition.reduce(
          (acc, food) => ({
            calories: acc.calories + (food.calories || 0),
            protein: acc.protein + (food.protein || 0),
            carbs: acc.carbs + (food.carbs || 0),
            fats: acc.fats + (food.fats || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );

        // Processar meal_substitutions com dados nutricionais
        const substitutionsWithNutrition: MealSubstitutionWithNutrition[] = (meal.meal_substitutions || []).map((sub: any) => {
          const itemsWithNutrition: MealSubstitutionItemWithNutrition[] = (sub.items || []).map((item: any) => {
            const nutrition = item.food_name ? nutritionMap.get(item.food_name) : null;

            if (nutrition) {
              const qtyValue = parseBrazilianNumber(item.quantity);
              const unitType = item.unit_type || 'gramas';

              // For unit-based items (not grams/ml), convert to grams using peso_por_unidade
              let gramsForCalculation: number;
              if (unitType === 'gramas' || unitType === 'ml') {
                gramsForCalculation = qtyValue;
              } else {
                // quantity is the number of units, multiply by peso_por_unidade to get grams
                const pesoUnidade = nutrition.peso_por_unidade || 100; // fallback to 100g if not set
                gramsForCalculation = qtyValue * pesoUnidade;
              }

              const multiplier = gramsForCalculation / 100;

              return {
                ...item,
                calories: parseBrazilianNumber(nutrition.caloria) * multiplier,
                protein: parseBrazilianNumber(nutrition.proteina) * multiplier,
                carbs: parseBrazilianNumber(nutrition.carboidrato) * multiplier,
                fats: parseBrazilianNumber(nutrition.gordura) * multiplier,
                display_name: nutrition.nome_simplificado || undefined,
              };
            }
            return item as MealSubstitutionItemWithNutrition;
          });

          // Calcular totais da substituição
          const subTotals = itemsWithNutrition.reduce(
            (acc, item) => ({
              calories: acc.calories + (item.calories || 0),
              protein: acc.protein + (item.protein || 0),
              carbs: acc.carbs + (item.carbs || 0),
              fats: acc.fats + (item.fats || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
          );

          return {
            ...sub,
            items: itemsWithNutrition,
            totalCalories: subTotals.calories,
            totalProtein: subTotals.protein,
            totalCarbs: subTotals.carbs,
            totalFats: subTotals.fats,
          };
        });

        return {
          ...meal,
          foods: foodsWithNutrition,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFats: totals.fats,
          meal_substitutions_with_nutrition: substitutionsWithNutrition.length > 0 ? substitutionsWithNutrition : undefined,
        };
      });

    setMeals(mealsWithNutrition);
    setSubstitutions(dietPlanData.food_substitutions || []);
  }

  async function fetchProgress() {
    const today = getBrasiliaDate();

    const { data } = await supabase
      .from('daily_progress')
      .select('meals_completed')
      .eq('client_id', profile!.id)
      .eq('date', today)
      .maybeSingle();

    if (data && data.meals_completed) {
      setCompletedMeals(data.meals_completed);
    } else {
      setCompletedMeals([]);
    }
  }

  async function fetchEquivalences() {
    // Buscar grupos de equivalencia com seus alimentos
    const { data: groups, error: groupsError } = await supabase
      .from('food_equivalence_groups')
      .select('*')
      .order('name');

    if (groupsError) {
      console.error('[Diet] Error fetching equivalence groups:', groupsError);
      return;
    }

    if (!groups || groups.length === 0) {
      setEquivalenceGroups([]);
      return;
    }

    // Buscar todos os alimentos de equivalencia
    const { data: foods, error: foodsError } = await supabase
      .from('food_equivalences')
      .select('*')
      .order('order_index');

    if (foodsError) {
      console.error('[Diet] Error fetching equivalences:', foodsError);
      return;
    }

    // Agrupar alimentos por grupo
    const groupsWithFoods: EquivalenceGroupWithFoods[] = groups.map((group) => ({
      ...group,
      foods: (foods || []).filter((f) => f.group_id === group.id),
    }));

    setEquivalenceGroups(groupsWithFoods);
  }

  // Buscar refeições extras do banco de dados
  async function fetchExtraMeals() {
    const today = getBrasiliaDate();

    try {
      // Buscar refeições extras com seus alimentos
      const { data: extraMealsData, error } = await supabase
        .from('extra_meals')
        .select(`
          id,
          client_id,
          date,
          meal_name,
          created_at,
          extra_meal_foods (
            id,
            extra_meal_id,
            food_id,
            food_name,
            quantity,
            unit,
            calories,
            protein,
            carbs,
            fats
          )
        `)
        .eq('client_id', profile!.id)
        .eq('date', today);

      if (error) {
        console.error('[Diet] Error fetching extra meals:', error);
        return;
      }

      if (!extraMealsData || extraMealsData.length === 0) {
        setExtraMeals([]);
        return;
      }

      // Converter para o formato ExtraMeal usado pelo componente
      const formattedExtraMeals: ExtraMeal[] = extraMealsData.map((meal: any) => {
        const foods = meal.extra_meal_foods || [];
        return {
          id: meal.id,
          meal_name: meal.meal_name,
          foods: foods.map((f: any) => ({
            id: f.id,
            name: f.food_name,
            quantity: f.quantity,
            quantity_units: null,
            unit_type: f.unit as any,
            peso_por_unidade: null,
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fats: f.fats,
            calories_100g: 0,
            protein_100g: 0,
            carbs_100g: 0,
            fats_100g: 0,
          })),
          total_calories: foods.reduce((sum: number, f: any) => sum + (f.calories || 0), 0),
          total_protein: foods.reduce((sum: number, f: any) => sum + (f.protein || 0), 0),
          total_carbs: foods.reduce((sum: number, f: any) => sum + (f.carbs || 0), 0),
          total_fats: foods.reduce((sum: number, f: any) => sum + (f.fats || 0), 0),
        };
      });

      setExtraMeals(formattedExtraMeals);
    } catch (error) {
      console.error('[Diet] Error in fetchExtraMeals:', error);
    }
  }

  // Handle diet selection change
  async function handleDietChange(dietId: string) {
    if (dietId === selectedDietId) return;

    setSelectedDietId(dietId);
    setStoredDietId(dietId);

    // Fetch meals for the newly selected diet
    const { data: dietPlanData } = await supabase
      .from('diet_plans')
      .select(`
        id,
        meals (
          id,
          name,
          suggested_time,
          order_index,
          meal_substitutions,
          meal_foods (
            id,
            food_name,
            quantity,
            order_index,
            unit_type,
            quantity_units
          )
        ),
        food_substitutions (
          id,
          diet_plan_id,
          original_food,
          substitute_food,
          substitute_quantity
        )
      `)
      .eq('id', dietId)
      .single();

    if (!dietPlanData) return;

    // Process meals with nutrition data (same logic as fetchDiet)
    const allFoodNames = new Set<string>();
    dietPlanData.meals?.forEach((meal: any) => {
      meal.meal_foods?.forEach((food: any) => {
        if (food.food_name) {
          allFoodNames.add(food.food_name);
        }
      });
      // Também coletar alimentos das substituições de refeição
      meal.meal_substitutions?.forEach((sub: any) => {
        sub.items?.forEach((item: any) => {
          if (item.food_name) {
            allFoodNames.add(item.food_name);
          }
        });
      });
    });

    let nutritionMap = new Map<string, { caloria: string; proteina: string; carboidrato: string; gordura: string; nome_simplificado?: string; peso_por_unidade?: number }>();

    if (allFoodNames.size > 0) {
      const { data: tacoData } = await supabase
        .from('tabela_taco')
        .select(`
          alimento,
          caloria,
          proteina,
          carboidrato,
          gordura,
          food_metadata (
            nome_simplificado,
            peso_por_unidade
          )
        `)
        .in('alimento', Array.from(allFoodNames));

      if (tacoData) {
        tacoData.forEach((item: any) => {
          const metadata = Array.isArray(item.food_metadata)
            ? item.food_metadata[0]
            : item.food_metadata;

          nutritionMap.set(item.alimento, {
            caloria: item.caloria,
            proteina: item.proteina,
            carboidrato: item.carboidrato,
            gordura: item.gordura,
            nome_simplificado: metadata?.nome_simplificado || undefined,
            peso_por_unidade: metadata?.peso_por_unidade || undefined,
          });
        });
      }
    }

    const mealsWithNutrition: MealWithNutrition[] = (dietPlanData.meals || [])
      .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
      .map((meal: any) => {
        const foodsWithNutrition: MealFoodWithNutrition[] = (meal.meal_foods || [])
          .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
          .map((food: any) => {
            const nutrition = food.food_name ? nutritionMap.get(food.food_name) : null;

            if (nutrition) {
              const qty = parseBrazilianNumber(food.quantity);
              const multiplier = qty / 100;

              return {
                ...food,
                calories: parseBrazilianNumber(nutrition.caloria) * multiplier,
                protein: parseBrazilianNumber(nutrition.proteina) * multiplier,
                carbs: parseBrazilianNumber(nutrition.carboidrato) * multiplier,
                fats: parseBrazilianNumber(nutrition.gordura) * multiplier,
                display_name: nutrition.nome_simplificado || undefined,
              };
            }
            return food as MealFoodWithNutrition;
          });

        const totals = foodsWithNutrition.reduce(
          (acc, food) => ({
            calories: acc.calories + (food.calories || 0),
            protein: acc.protein + (food.protein || 0),
            carbs: acc.carbs + (food.carbs || 0),
            fats: acc.fats + (food.fats || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );

        // Processar meal_substitutions com dados nutricionais
        const substitutionsWithNutrition: MealSubstitutionWithNutrition[] = (meal.meal_substitutions || []).map((sub: any) => {
          const itemsWithNutrition: MealSubstitutionItemWithNutrition[] = (sub.items || []).map((item: any) => {
            const nutrition = item.food_name ? nutritionMap.get(item.food_name) : null;

            if (nutrition) {
              const qtyValue = parseBrazilianNumber(item.quantity);
              const unitType = item.unit_type || 'gramas';

              // For unit-based items (not grams/ml), convert to grams using peso_por_unidade
              let gramsForCalculation: number;
              if (unitType === 'gramas' || unitType === 'ml') {
                gramsForCalculation = qtyValue;
              } else {
                // quantity is the number of units, multiply by peso_por_unidade to get grams
                const pesoUnidade = nutrition.peso_por_unidade || 100; // fallback to 100g if not set
                gramsForCalculation = qtyValue * pesoUnidade;
              }

              const multiplier = gramsForCalculation / 100;

              return {
                ...item,
                calories: parseBrazilianNumber(nutrition.caloria) * multiplier,
                protein: parseBrazilianNumber(nutrition.proteina) * multiplier,
                carbs: parseBrazilianNumber(nutrition.carboidrato) * multiplier,
                fats: parseBrazilianNumber(nutrition.gordura) * multiplier,
                display_name: nutrition.nome_simplificado || undefined,
              };
            }
            return item as MealSubstitutionItemWithNutrition;
          });

          const subTotals = itemsWithNutrition.reduce(
            (acc, item) => ({
              calories: acc.calories + (item.calories || 0),
              protein: acc.protein + (item.protein || 0),
              carbs: acc.carbs + (item.carbs || 0),
              fats: acc.fats + (item.fats || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
          );

          return {
            ...sub,
            items: itemsWithNutrition,
            totalCalories: subTotals.calories,
            totalProtein: subTotals.protein,
            totalCarbs: subTotals.carbs,
            totalFats: subTotals.fats,
          };
        });

        return {
          ...meal,
          foods: foodsWithNutrition,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFats: totals.fats,
          meal_substitutions_with_nutrition: substitutionsWithNutrition.length > 0 ? substitutionsWithNutrition : undefined,
        };
      });

    setMeals(mealsWithNutrition);
    setSubstitutions(dietPlanData.food_substitutions || []);
  }

  async function toggleMeal(mealId: string) {
    const today = getBrasiliaDate();
    const isCompleted = completedMeals.includes(mealId);
    const newCompleted = isCompleted
      ? completedMeals.filter(id => id !== mealId)
      : [...completedMeals, mealId];

    // Atualiza estado local imediatamente
    setCompletedMeals(newCompleted);

    try {
      // Verifica se já existe registro para hoje
      const { data: existing } = await supabase
        .from('daily_progress')
        .select('id')
        .eq('client_id', profile!.id)
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        // Atualiza registro existente
        const { error } = await supabase
          .from('daily_progress')
          .update({
            meals_completed: newCompleted
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Cria novo registro para hoje
        const { error } = await supabase.from('daily_progress').insert({
          client_id: profile!.id,
          date: today,
          exercises_completed: [],
          meals_completed: newCompleted,
          water_consumed_ml: 0,
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      // Reverte o estado local em caso de erro
      setCompletedMeals(completedMeals);
    }
  }

  function formatTime(time: string | null): string {
    if (!time) return '';
    return time.slice(0, 5);
  }

  function handleOpenMeal(meal: MealWithNutrition) {
    setSelectedMeal(meal);
  }

  function handleCloseMeal() {
    setSelectedMeal(null);
  }

  // Skeleton de carregamento
  const LoadingSkeleton = () => (
    <div className={styles.skeleton}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeletonCheckbox} />
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonMeta} />
          </div>
          <div className={styles.skeletonArrow} />
        </div>
      ))}
    </div>
  );

  // Get current diet name for display
  const currentDietName = availableDiets.find(d => d.id === selectedDietId)?.name || 'Dieta';

  return (
    <PageContainer>
      <Header title="Dieta" subtitle={getBrasiliaDisplayDate()} showBack />

      <main className={styles.content}>
        {/* Diet Selector - only show if more than one diet available */}
        {availableDiets.length > 1 && (
          <div className={styles.dietSelector}>
            <label className={styles.dietSelectorLabel}>Dieta ativa:</label>
            <select
              className={styles.dietSelectorSelect}
              value={selectedDietId || ''}
              onChange={(e) => handleDietChange(e.target.value)}
            >
              {availableDiets.map((diet) => (
                <option key={diet.id} value={diet.id}>
                  {diet.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Show diet name if only one diet */}
        {availableDiets.length === 1 && (
          <div className={styles.singleDietName}>{currentDietName}</div>
        )}

        {/* Barra de Macros do Dia */}
        {meals.length > 0 && (
          <DailyMacrosSummary
            totalPlanned={totalPlannedMacros}
            consumed={consumedMacros}
          />
        )}

        {loading && meals.length === 0 ? (
          <LoadingSkeleton />
        ) : meals.length > 0 ? (
          <>
            {meals.map((meal) => {
              const isCompleted = completedMeals.includes(meal.id);
              const hasMealOptions = meal.meal_substitutions_with_nutrition && meal.meal_substitutions_with_nutrition.length > 0;
              const selectedOption = selectedMealOptions[meal.id] || 0;
              const totalOptions = hasMealOptions ? meal.meal_substitutions_with_nutrition!.length + 1 : 1;

              // Get calories based on selected option
              const displayCalories = selectedOption === 0
                ? meal.totalCalories
                : meal.meal_substitutions_with_nutrition?.[selectedOption - 1]?.totalCalories || 0;

              return (
                <Card
                  key={meal.id}
                  hoverable
                  className={styles.mealCard}
                  onClick={() => handleOpenMeal(meal)}
                >
                  <Checkbox
                    checked={isCompleted}
                    stopPropagation
                    onChange={() => toggleMeal(meal.id)}
                  />
                  <img
                    src={getMealImage(meal.name)}
                    alt={meal.name}
                    className={styles.mealImage}
                  />
                  <div className={styles.mealContent}>
                    <h3 className={`${styles.mealName} ${isCompleted ? styles.completed : ''}`}>
                      {meal.name}
                    </h3>

                    {/* Meal Options Tabs/Pills */}
                    {hasMealOptions && (
                      <div
                        className={styles.mealOptionsTabs}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {Array.from({ length: totalOptions }).map((_, idx) => (
                          <button
                            key={idx}
                            className={`${styles.mealOptionTab} ${selectedOption === idx ? styles.mealOptionTabActive : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMealOptions(prev => ({ ...prev, [meal.id]: idx }));
                            }}
                          >
                            {idx === 0 ? 'Opção 1' : meal.meal_substitutions_with_nutrition![idx - 1].name || `Opção ${idx + 1}`}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className={styles.mealMeta}>
                      {meal.suggested_time && (
                        <span className={styles.mealTime}>
                          <Clock size={14} />
                          {formatTime(meal.suggested_time)}
                        </span>
                      )}
                      {displayCalories > 0 && (
                        <span className={styles.mealCalories}>
                          {Math.round(displayCalories)} kcal
                        </span>
                      )}
                    </div>
                    <p className={styles.mealHint}>Toque para ver detalhes</p>
                  </div>
                  <button className={styles.arrowButton}>
                    <ChevronRight size={20} />
                  </button>
                </Card>
              );
            })}

            {/* Refeições Extras */}
            {extraMeals.length > 0 && (
              <div className={styles.extraMealsSection}>
                <h3 className={styles.extraMealsTitle}>Refeicoes Extras</h3>
                {extraMeals.map((meal) => (
                  <Card key={meal.id} className={styles.extraMealCard}>
                    <div className={styles.extraMealContent}>
                      <h4 className={styles.extraMealName}>{meal.meal_name}</h4>
                      <div className={styles.extraMealMacros}>
                        <span className={styles.extraMealCalories}>
                          {meal.total_calories} kcal
                        </span>
                        <span>P: {meal.total_protein.toFixed(1)}g</span>
                        <span>C: {meal.total_carbs.toFixed(1)}g</span>
                        <span>G: {meal.total_fats.toFixed(1)}g</span>
                      </div>
                    </div>
                    <button
                      className={styles.removeExtraButton}
                      onClick={() => handleRemoveExtraMeal(meal.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </Card>
                ))}
              </div>
            )}

            {/* Botão Adicionar Refeição Extra */}
            <Button
              variant="outline"
              fullWidth
              className={styles.addExtraButton}
              onClick={() => setShowAddExtraMeal(true)}
            >
              <Plus size={18} />
              Adicionar Refeicao Extra
            </Button>
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>Nenhuma dieta cadastrada</p>
          </div>
        )}
      </main>

      <MealDetailSheet
        isOpen={!!selectedMeal}
        onClose={handleCloseMeal}
        meal={selectedMeal}
        completedMeals={completedMeals}
        onToggleMeal={toggleMeal}
        substitutions={substitutions}
        equivalenceGroups={equivalenceGroups}
        selectedMealOptions={selectedMealOptions}
        onSetMealOption={(mealId, idx) => setSelectedMealOptions(prev => ({ ...prev, [mealId]: idx }))}
      />

      {/* Modal Adicionar Refeição Extra */}
      <AddExtraMealModal
        isOpen={showAddExtraMeal}
        onClose={() => setShowAddExtraMeal(false)}
        onAdd={handleAddExtraMeal}
      />

      <BottomNav />
    </PageContainer>
  );
}
