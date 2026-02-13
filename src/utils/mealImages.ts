const MEAL_IMAGES: Record<string, string> = {
  'cafe': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=200&h=200&fit=crop',
  'lanche_manha': 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=200&h=200&fit=crop',
  'almoco': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
  'lanche_tarde': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop',
  'jantar': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop',
  'ceia': 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=200&h=200&fit=crop',
  'pre_treino': 'https://images.unsplash.com/photo-1622485831930-34ac18d72143?w=200&h=200&fit=crop',
  'pos_treino': 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=200&h=200&fit=crop',
  'default': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop',
};

export function getMealImage(mealName: string): string {
  const name = mealName.toLowerCase();

  if ((name.includes('cafe') || name.includes('café') || name.includes('manhã')) && !name.includes('lanche')) {
    return MEAL_IMAGES.cafe;
  }
  if (name.includes('lanche') && (name.includes('manhã') || name.includes('manha'))) {
    return MEAL_IMAGES.lanche_manha;
  }
  if (name.includes('almoco') || name.includes('almoço')) {
    return MEAL_IMAGES.almoco;
  }
  if (name.includes('lanche') && name.includes('tarde')) {
    return MEAL_IMAGES.lanche_tarde;
  }
  if (name.includes('lanche')) {
    return MEAL_IMAGES.lanche_tarde;
  }
  if (name.includes('jantar') || name.includes('janta')) {
    return MEAL_IMAGES.jantar;
  }
  if (name.includes('ceia')) {
    return MEAL_IMAGES.ceia;
  }
  if (name.includes('pre') && name.includes('treino')) {
    return MEAL_IMAGES.pre_treino;
  }
  if (name.includes('pos') || name.includes('pós')) {
    return MEAL_IMAGES.pos_treino;
  }

  return MEAL_IMAGES.default;
}
