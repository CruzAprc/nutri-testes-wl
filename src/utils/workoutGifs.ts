const WORKOUT_GIFS: Record<string, string> = {
  'peito': '/images/workouts/chest.gif',
  'peitoral': '/images/workouts/chest.gif',
  'chest': '/images/workouts/chest.gif',
  'supino': '/images/workouts/chest.gif',
  'costas': '/images/workouts/back.gif',
  'dorsal': '/images/workouts/back.gif',
  'back': '/images/workouts/back.gif',
  'ombro': '/images/workouts/shoulders.gif',
  'ombros': '/images/workouts/shoulders.gif',
  'deltoid': '/images/workouts/shoulders.gif',
  'trapezio': '/images/workouts/shoulders.gif',
  'trapézio': '/images/workouts/shoulders.gif',
  'shoulders': '/images/workouts/shoulders.gif',
  'biceps': '/images/workouts/biceps.gif',
  'bíceps': '/images/workouts/biceps.gif',
  'braco': '/images/workouts/biceps.gif',
  'braço': '/images/workouts/biceps.gif',
  'braços': '/images/workouts/biceps.gif',
  'arms': '/images/workouts/biceps.gif',
  'triceps': '/images/workouts/triceps.gif',
  'tríceps': '/images/workouts/triceps.gif',
  'perna': '/images/workouts/legs.gif',
  'pernas': '/images/workouts/legs.gif',
  'legs': '/images/workouts/legs.gif',
  'quadriceps': '/images/workouts/legs.gif',
  'quadríceps': '/images/workouts/legs.gif',
  'posterior': '/images/workouts/legs.gif',
  'panturrilha': '/images/workouts/legs.gif',
  'gluteo': '/images/workouts/glutes.gif',
  'glúteo': '/images/workouts/glutes.gif',
  'glúteos': '/images/workouts/glutes.gif',
  'glutes': '/images/workouts/glutes.gif',
  'abdomen': '/images/workouts/abs.gif',
  'abdômen': '/images/workouts/abs.gif',
  'abdominal': '/images/workouts/abs.gif',
  'abs': '/images/workouts/abs.gif',
  'core': '/images/workouts/abs.gif',
};

const DEFAULT_GIF = '/images/workouts/default.gif';

export function getWorkoutGif(workoutType: string | null): string {
  if (!workoutType) return DEFAULT_GIF;

  const normalized = workoutType.toLowerCase().trim();

  // Direct match
  if (WORKOUT_GIFS[normalized]) {
    return WORKOUT_GIFS[normalized];
  }

  // Partial match — check if any keyword is contained in the workout type
  for (const [keyword, gif] of Object.entries(WORKOUT_GIFS)) {
    if (normalized.includes(keyword)) {
      return gif;
    }
  }

  return DEFAULT_GIF;
}
