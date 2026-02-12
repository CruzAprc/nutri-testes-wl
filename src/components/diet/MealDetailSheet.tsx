import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Check, ChevronDown, ChevronUp, RefreshCw, Clock } from 'lucide-react';
import { parseBrazilianNumber } from '../../utils/parsers';
import { formatFoodName } from '../../utils/formatters';
import { formatQuantityDisplay } from '../../utils/foodUnits';
import { UNIT_TYPES } from '../../constants/foodUnits';
import type { FoodSubstitution, FoodEquivalenceGroup, FoodEquivalence } from '../../types/database';
import type { MealWithNutrition, EquivalenceGroupWithFoods } from '../../pages/client/Diet';
import styles from './MealDetailSheet.module.css';

interface MealDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  meals: MealWithNutrition[];
  initialMealIndex: number;
  completedMeals: string[];
  onToggleMeal: (mealId: string) => void;
  substitutions: FoodSubstitution[];
  equivalenceGroups: EquivalenceGroupWithFoods[];
  selectedMealOptions: Record<string, number>;
  onSetMealOption: (mealId: string, optionIndex: number) => void;
}

// Meal name to emoji mapping
function getMealEmoji(mealName: string): string {
  const name = mealName.toLowerCase();
  if (name.includes('cafe') || name.includes('café') || name.includes('manha') || name.includes('manhã')) return '☕';
  if (name.includes('almoco') || name.includes('almoço')) return '🍛';
  if (name.includes('jantar') || name.includes('janta')) return '🍽️';
  if (name.includes('lanche') && name.includes('tarde')) return '🥪';
  if (name.includes('lanche') && name.includes('manha')) return '🍎';
  if (name.includes('lanche')) return '🥤';
  if (name.includes('ceia')) return '🌙';
  if (name.includes('pre') && name.includes('treino')) return '💪';
  if (name.includes('pos') || name.includes('pós')) return '🥛';
  if (name.includes('snack')) return '🍿';
  return '🍽️';
}

function formatTime(time: string | null): string {
  if (!time) return '';
  return time.slice(0, 5);
}

export function MealDetailSheet({
  isOpen,
  onClose,
  meals,
  initialMealIndex,
  completedMeals,
  onToggleMeal,
  substitutions,
  equivalenceGroups,
  selectedMealOptions,
  onSetMealOption,
}: MealDetailSheetProps) {
  const [activeMealIndex, setActiveMealIndex] = useState(initialMealIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showAllFoods, setShowAllFoods] = useState(false);
  const [expandedFoods, setExpandedFoods] = useState<Set<string>>(new Set());
  const [expandedEquivalences, setExpandedEquivalences] = useState<Set<string>>(new Set());

  const gestureStartRef = useRef<{ y: number; time: number } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const currentMeal = meals[activeMealIndex];

  // Sync initialMealIndex when it changes (new meal opened)
  useEffect(() => {
    if (isOpen) {
      setActiveMealIndex(initialMealIndex);
      setShowAllFoods(false);
      setExpandedFoods(new Set());
      setExpandedEquivalences(new Set());
      setIsClosing(false);
    }
  }, [isOpen, initialMealIndex]);

  // Scroll active tab into view
  useEffect(() => {
    if (!tabsScrollRef.current) return;
    const activeTab = tabsScrollRef.current.children[activeMealIndex] as HTMLElement | undefined;
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeMealIndex]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent default scroll during drag
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !isOpen) return;

    function onTouchMove(e: TouchEvent) {
      if (gestureStartRef.current && isDragging) {
        const delta = e.touches[0].clientY - gestureStartRef.current.y;
        if (delta > 0) {
          e.preventDefault();
        }
      }
    }

    sheet.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => sheet.removeEventListener('touchmove', onTouchMove);
  }, [isOpen, isDragging]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [onClose]);

  // Touch handlers for swipe-down-to-close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const isDragHandle = target.closest(`.${styles.dragHandle}`) || target.closest(`.${styles.header}`);
    const isBodyAtTop = bodyRef.current ? bodyRef.current.scrollTop <= 0 : true;

    if (!isDragHandle && !isBodyAtTop) return;

    gestureStartRef.current = { y: e.touches[0].clientY, time: Date.now() };
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gestureStartRef.current) return;
    const delta = e.touches[0].clientY - gestureStartRef.current.y;
    if (delta > 0) {
      setDragOffset(delta);
    }
  }, []);

  const handleGestureEnd = useCallback(() => {
    if (!gestureStartRef.current) return;

    const elapsed = Date.now() - gestureStartRef.current.time;
    const velocity = dragOffset / Math.max(elapsed, 1);

    if (dragOffset > window.innerHeight * 0.25 || velocity > 0.5) {
      handleClose();
    }

    setDragOffset(0);
    setIsDragging(false);
    gestureStartRef.current = null;
  }, [dragOffset, handleClose]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isDragHandle = target.closest(`.${styles.dragHandle}`) || target.closest(`.${styles.header}`);
    if (!isDragHandle) return;

    gestureStartRef.current = { y: e.clientY, time: Date.now() };
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gestureStartRef.current || !isDragging) return;
    const delta = e.clientY - gestureStartRef.current.y;
    if (delta > 0) {
      setDragOffset(delta);
    }
  }, [isDragging]);

  // Helper: get food substitutions
  function getSubstitutionsForFood(foodName: string): FoodSubstitution[] {
    return substitutions.filter(
      (sub) => sub.original_food.toLowerCase() === foodName.toLowerCase()
    );
  }

  // Helper: get equivalences for food
  function getEquivalencesForFood(foodName: string, displayName?: string): { group: FoodEquivalenceGroup; currentFood: FoodEquivalence; equivalents: FoodEquivalence[] } | null {
    const normalizedName = foodName.toLowerCase().trim();
    const normalizedDisplayName = displayName?.toLowerCase().trim();

    for (const group of equivalenceGroups) {
      let currentFood: FoodEquivalence | undefined = undefined;

      if (normalizedDisplayName) {
        currentFood = group.foods.find((f) => f.food_name.toLowerCase().trim() === normalizedDisplayName);
      }

      if (!currentFood) {
        currentFood = group.foods.find(
          (f) => f.food_name.toLowerCase().trim() === normalizedName
        );
      }

      if (!currentFood) {
        currentFood = group.foods.find((f) => {
          const eqName = f.food_name.toLowerCase().trim();
          return normalizedName.includes(eqName) ||
                 eqName.includes(normalizedName) ||
                 (normalizedDisplayName && (
                   normalizedDisplayName.includes(eqName) ||
                   eqName.includes(normalizedDisplayName)
                 ));
        });
      }

      if (!currentFood) {
        const groupName = group.name.toLowerCase().trim();
        const portionMatch = normalizedName.match(/porção\s+de\s+(\w+)/i) ||
                            normalizedName.match(/porcao\s+de\s+(\w+)/i);
        if (portionMatch && group.foods.length > 0) {
          const portionType = portionMatch[1].toLowerCase();
          if (groupName.includes(portionType) || portionType.includes(groupName.replace('s', ''))) {
            return {
              group,
              currentFood: group.foods[0],
              equivalents: group.foods,
            };
          }
        }
      }

      if (currentFood) {
        const equivalents = group.foods.filter((f) => f.id !== currentFood!.id);
        return { group, currentFood, equivalents };
      }
    }

    return null;
  }

  function toggleFoodExpansion(foodId: string) {
    setExpandedFoods((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(foodId)) {
        newSet.delete(foodId);
      } else {
        newSet.add(foodId);
      }
      return newSet;
    });
  }

  function toggleEquivalenceExpansion(foodId: string) {
    setExpandedEquivalences((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(foodId)) {
        newSet.delete(foodId);
      } else {
        newSet.add(foodId);
      }
      return newSet;
    });
  }

  function handleTabChange(index: number) {
    setActiveMealIndex(index);
    setShowAllFoods(false);
    setExpandedFoods(new Set());
    setExpandedEquivalences(new Set());
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }

  if (!isOpen || !currentMeal) return null;

  const isCompleted = completedMeals.includes(currentMeal.id);
  const selectedOption = selectedMealOptions[currentMeal.id] || 0;
  const hasMealOptions = currentMeal.meal_substitutions_with_nutrition && currentMeal.meal_substitutions_with_nutrition.length > 0;

  // Get current macros based on selected option
  const currentMacros = selectedOption === 0
    ? { protein: currentMeal.totalProtein, carbs: currentMeal.totalCarbs, fats: currentMeal.totalFats, calories: currentMeal.totalCalories }
    : (() => {
        const sub = currentMeal.meal_substitutions_with_nutrition?.[selectedOption - 1];
        return sub
          ? { protein: sub.totalProtein, carbs: sub.totalCarbs, fats: sub.totalFats, calories: sub.totalCalories }
          : { protein: 0, carbs: 0, fats: 0, calories: 0 };
      })();

  // Get current foods based on selected option
  const currentFoods = selectedOption === 0
    ? currentMeal.foods
    : currentMeal.meal_substitutions_with_nutrition?.[selectedOption - 1]?.items || [];

  const VISIBLE_FOOD_COUNT = 5;
  const hasMoreFoods = currentFoods.length > VISIBLE_FOOD_COUNT;
  const visibleFoods = showAllFoods ? currentFoods : currentFoods.slice(0, VISIBLE_FOOD_COUNT);
  const hiddenCount = currentFoods.length - VISIBLE_FOOD_COUNT;

  // Sheet transform style
  const sheetStyle: React.CSSProperties = {
    transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
    transition: isDragging ? 'none' : undefined,
  };

  return (
    <>
      {/* 1. Backdrop */}
      <div className={styles.overlay} onClick={handleClose} />

      {/* 2. Sheet Container */}
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${isClosing ? styles.sheetClosing : ''}`}
        style={sheetStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleGestureEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleGestureEnd}
        onMouseLeave={handleGestureEnd}
      >
        {/* Drag Handle */}
        <div className={styles.dragHandle}>
          <div className={styles.handleBar} />
        </div>

        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleClose}>
            <ArrowLeft size={20} />
          </button>
          <h2 className={styles.headerTitle}>{currentMeal.name}</h2>
        </div>

        {/* Tabs - only show if more than 1 meal */}
        {meals.length > 1 && (
          <div className={styles.tabs}>
            <div ref={tabsScrollRef} className={styles.tabsScroll}>
              {meals.map((meal, idx) => (
                <button
                  key={meal.id}
                  className={`${styles.tab} ${idx === activeMealIndex ? styles.tabActive : ''}`}
                  onClick={() => handleTabChange(idx)}
                >
                  {meal.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Body */}
        <div ref={bodyRef} className={styles.body}>
          {/* Meal Options Tabs */}
          {hasMealOptions && (
            <div className={styles.mealOptionsTabs}>
              {Array.from({ length: currentMeal.meal_substitutions_with_nutrition!.length + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  className={`${styles.mealOptionTab} ${selectedOption === idx ? styles.mealOptionTabActive : ''}`}
                  onClick={() => onSetMealOption(currentMeal.id, idx)}
                >
                  {idx === 0 ? 'Opcao 1' : currentMeal.meal_substitutions_with_nutrition![idx - 1].name || `Opcao ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* 4. Summary Card (gradient) */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryInfo}>
              <h3 className={styles.summaryTitle}>{currentMeal.name}</h3>
              <p className={styles.summaryMacros}>
                {Math.round(currentMacros.calories)} kcal &middot; P: {Math.round(currentMacros.protein)}g &middot; C: {Math.round(currentMacros.carbs)}g &middot; G: {Math.round(currentMacros.fats)}g
              </p>
              {currentMeal.suggested_time && (
                <p className={styles.summaryTime}>
                  <Clock size={14} />
                  {formatTime(currentMeal.suggested_time)}
                </p>
              )}
            </div>
            <div className={styles.summaryIcon}>
              {getMealEmoji(currentMeal.name)}
            </div>
          </div>

          {/* 5. Food List */}
          <div className={styles.foodSection}>
            <h4 className={styles.foodSectionTitle}>Alimentos</h4>

            {selectedOption === 0 ? (
              /* Original foods */
              <ul className={styles.foodList}>
                {(visibleFoods as typeof currentMeal.foods).map((food) => {
                  const foodSubs = getSubstitutionsForFood(food.food_name);
                  const isExpanded = expandedFoods.has(food.id);
                  const hasSubstitutions = foodSubs.length > 0;
                  const equivalenceData = getEquivalencesForFood(food.food_name, food.display_name);
                  const hasEquivalences = equivalenceData && equivalenceData.equivalents.length > 0;
                  const isEquivalenceExpanded = expandedEquivalences.has(food.id);
                  const quantityDisplay = formatQuantityDisplay(
                    parseBrazilianNumber(food.quantity),
                    food.quantity_units,
                    food.unit_type || 'gramas'
                  );

                  return (
                    <li key={food.id} className={styles.foodItemWrapper}>
                      <div className={styles.foodCard}>
                        <div className={styles.foodCheck}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <div className={styles.foodInfo}>
                          <span className={styles.foodName}>
                            {food.display_name || formatFoodName(food.food_name)}
                          </span>
                          <span className={styles.foodDetails}>
                            {quantityDisplay}
                            {food.calories !== undefined && food.calories > 0 && (
                              <> &middot; {Math.round(food.calories)} kcal</>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Substitutions toggle */}
                      {hasSubstitutions && (
                        <button
                          className={styles.substitutionToggle}
                          onClick={() => toggleFoodExpansion(food.id)}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          <span>Ver substituicoes ({foodSubs.length})</span>
                        </button>
                      )}

                      {isExpanded && hasSubstitutions && (
                        <div className={styles.inlineSubstitutions}>
                          <span className={styles.substitutionHint}>Troque por:</span>
                          {foodSubs.map((sub) => (
                            <div key={sub.id} className={styles.substitutionRow}>
                              <span className={styles.substitutionArrow}>&rarr;</span>
                              <span>{formatFoodName(sub.substitute_food)} ({sub.substitute_quantity}g)</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Equivalences toggle */}
                      {hasEquivalences && (
                        <button
                          className={styles.equivalenceToggle}
                          onClick={() => toggleEquivalenceExpansion(food.id)}
                        >
                          <RefreshCw size={16} />
                          {isEquivalenceExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          <span>Ver equivalencias ({equivalenceData.equivalents.length})</span>
                        </button>
                      )}

                      {isEquivalenceExpanded && hasEquivalences && equivalenceData && (() => {
                        const actualQuantity = parseBrazilianNumber(food.quantity);
                        const baseQuantity = equivalenceData.currentFood.quantity_grams;
                        const ratio = baseQuantity > 0 ? actualQuantity / baseQuantity : 1;

                        return (
                          <div className={styles.inlineEquivalences}>
                            <span className={styles.equivalenceGroupName}>
                              {equivalenceData.group.name}
                            </span>
                            <span className={styles.equivalenceHint}>
                              Troque {Math.round(actualQuantity)}g por:
                            </span>
                            {equivalenceData.equivalents.map((eq) => (
                              <div key={eq.id} className={styles.equivalenceRow}>
                                <span className={styles.equivalenceArrow}>&rarr;</span>
                                <span>{eq.food_name} ({Math.round(eq.quantity_grams * ratio)}g)</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </li>
                  );
                })}
              </ul>
            ) : (
              /* Substitution foods */
              <ul className={styles.foodList}>
                {(visibleFoods as any[]).map((item: any, idx: number) => {
                  const unitType = item.unit_type || 'gramas';
                  const qtyValue = parseBrazilianNumber(item.quantity);

                  let quantityDisplay: string;
                  if (unitType === 'gramas') {
                    quantityDisplay = `${qtyValue}g`;
                  } else if (unitType === 'ml') {
                    quantityDisplay = `${qtyValue}ml`;
                  } else {
                    const unitsCount = item.quantity_units ?? qtyValue;
                    const unitInfo = UNIT_TYPES[unitType as keyof typeof UNIT_TYPES] || { singular: unitType, plural: unitType };
                    const label = unitsCount === 1 ? unitInfo.singular : unitInfo.plural;
                    quantityDisplay = `${unitsCount} ${label}`;
                  }

                  return (
                    <li key={idx} className={styles.foodItemWrapper}>
                      <div className={styles.foodCard}>
                        <div className={styles.foodCheck}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <div className={styles.foodInfo}>
                          <span className={styles.foodName}>
                            {item.display_name || formatFoodName(item.food_name)}
                          </span>
                          <span className={styles.foodDetails}>
                            {quantityDisplay}
                            {item.calories !== undefined && item.calories > 0 && (
                              <> &middot; {Math.round(item.calories)} kcal</>
                            )}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Show More Button */}
            {hasMoreFoods && !showAllFoods && (
              <button
                className={styles.showMoreButton}
                onClick={() => setShowAllFoods(true)}
              >
                <ChevronDown size={16} />
                +{hiddenCount} alimentos
              </button>
            )}

            {hasMoreFoods && showAllFoods && (
              <button
                className={styles.showMoreButton}
                onClick={() => setShowAllFoods(false)}
              >
                <ChevronUp size={16} />
                Mostrar menos
              </button>
            )}
          </div>
        </div>

        {/* 6. Bottom Action (sticky) */}
        <div className={styles.bottomAction}>
          <button
            className={`${styles.completeButton} ${isCompleted ? styles.completeButtonDone : ''}`}
            onClick={() => onToggleMeal(currentMeal.id)}
          >
            {isCompleted && <Check size={20} />}
            {isCompleted ? 'Consumido' : 'Marcar como consumido'}
          </button>
        </div>
      </div>
    </>
  );
}
