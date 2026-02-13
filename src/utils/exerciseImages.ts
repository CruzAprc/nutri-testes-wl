const muscleGroupImages: Record<string, string> = {
  chest: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop',
  back: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=200&h=200&fit=crop',
  shoulders: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=200&h=200&fit=crop',
  arms: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&h=200&fit=crop',
  legs: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=200&h=200&fit=crop',
  abs: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop',
  default: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop',
};

const keywordMap: [RegExp, string][] = [
  [/peito|peitoral|supino|crucifixo|fly|chest|crossover/i, 'chest'],
  [/costas|remada|puxada|pulldown|pull|lat|dorsal/i, 'back'],
  [/ombro|desenvolvimento|eleva[çc][aã]o|lateral|frontal|trap[eé]zio/i, 'shoulders'],
  [/b[ií]ceps|rosca|curl|bra[çc]o|tr[ií]ceps|franc[eê]s|testa/i, 'arms'],
  [/perna|agachamento|leg|quadr[ií]ceps|posterior|panturrilha|stiff|extensora|flexora|hack/i, 'legs'],
  [/abd[oô]men|abdominal|prancha|crunch|obl[ií]quo/i, 'abs'],
];

export function getExerciseImage(exerciseName: string): string {
  const name = exerciseName.toLowerCase();
  for (const [pattern, group] of keywordMap) {
    if (pattern.test(name)) {
      return muscleGroupImages[group];
    }
  }
  return muscleGroupImages.default;
}
