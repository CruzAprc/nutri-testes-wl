-- =============================================
-- FULL SCHEMA - App Nutris
-- Migration completa com todas as tabelas
-- =============================================

-- =============================================
-- 1. FUNCOES AUXILIARES
-- =============================================

-- Funcao para verificar admin (evita referencia circular no RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funcao para atualizar updated_at em templates
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 2. TABELAS PRINCIPAIS
-- =============================================

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(10) DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  height_cm NUMERIC,
  current_weight_kg NUMERIC,
  starting_weight_kg NUMERIC,
  goal_weight_kg NUMERIC,
  age INTEGER,
  coaching_start_date DATE,
  plan_start_date DATE,
  plan_end_date DATE,
  goals TEXT,
  is_active BOOLEAN DEFAULT true,
  protein_goal NUMERIC,
  carbs_goal NUMERIC,
  fats_goal NUMERIC,
  calories_goal NUMERIC,
  fiber_goal NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANAMNESIS
CREATE TABLE IF NOT EXISTS anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meals_per_day INTEGER,
  water_liters_per_day NUMERIC,
  meal_times JSONB,
  meals_prepared_same_day BOOLEAN,
  preferred_foods TEXT,
  disliked_foods TEXT,
  supplements TEXT,
  food_allergies TEXT,
  gluten_intolerance BOOLEAN DEFAULT false,
  alcohol_consumption TEXT,
  current_exercise_type TEXT,
  exercise_duration TEXT,
  routine_exercises TEXT,
  weekly_routine JSONB,
  health_rating TEXT,
  smoker BOOLEAN DEFAULT false,
  cigarettes_per_day INTEGER,
  digestion TEXT,
  bowel_frequency TEXT,
  medications TEXT,
  bedtime TEXT,
  wakeup_time TEXT,
  sleep_quality TEXT,
  sleep_hours NUMERIC,
  diseases TEXT,
  family_history TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DIET_PLANS
CREATE TABLE IF NOT EXISTS diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  daily_calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fat_g INTEGER,
  water_goal_liters NUMERIC(3,1) DEFAULT 2.0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEALS
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  suggested_time TIME,
  order_index INTEGER DEFAULT 0,
  meal_substitutions JSONB DEFAULT '[]'
);

-- MEAL_FOODS
CREATE TABLE IF NOT EXISTS meal_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  quantity_units NUMERIC(10,2),
  unit_type TEXT DEFAULT 'gramas',
  order_index INTEGER DEFAULT 0
);

-- FOOD_SUBSTITUTIONS
CREATE TABLE IF NOT EXISTS food_substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
  original_food TEXT NOT NULL,
  substitute_food TEXT NOT NULL,
  substitute_quantity TEXT NOT NULL
);

-- WORKOUT_PLANS
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DAILY_WORKOUTS
CREATE TABLE IF NOT EXISTS daily_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  workout_type TEXT
);

-- EXERCISES
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_workout_id UUID NOT NULL REFERENCES daily_workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER DEFAULT 3,
  reps TEXT DEFAULT '10-12',
  rest TEXT,
  weight_kg NUMERIC(5,2),
  video_url TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  technique_id TEXT,
  effort_parameter_id TEXT
);

-- EXERCISE_LIBRARY
CREATE TABLE IF NOT EXISTS exercise_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  video_url TEXT,
  muscle_group TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DAILY_PROGRESS
CREATE TABLE IF NOT EXISTS daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  exercises_completed TEXT[] DEFAULT '{}',
  meals_completed TEXT[] DEFAULT '{}',
  water_consumed_ml INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WEIGHT_HISTORY
CREATE TABLE IF NOT EXISTS weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA_TACO (dados nutricionais)
CREATE TABLE IF NOT EXISTS tabela_taco (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  alimento TEXT NOT NULL,
  caloria TEXT,
  proteina TEXT,
  carboidrato TEXT,
  gordura TEXT,
  fibra TEXT
);

-- FOOD_METADATA
CREATE TABLE IF NOT EXISTS food_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taco_id INTEGER NOT NULL REFERENCES tabela_taco(id) ON DELETE CASCADE,
  nome_simplificado TEXT NOT NULL,
  unidade_tipo TEXT DEFAULT 'gramas',
  peso_por_unidade NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXTRA_MEALS
CREATE TABLE IF NOT EXISTS extra_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXTRA_MEAL_FOODS
CREATE TABLE IF NOT EXISTS extra_meal_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extra_meal_id UUID NOT NULL REFERENCES extra_meals(id) ON DELETE CASCADE,
  food_id INTEGER,
  food_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  calories NUMERIC DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fats NUMERIC DEFAULT 0
);

-- EXERCISE_LOGS
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL,
  daily_workout_id UUID NOT NULL,
  date DATE NOT NULL,
  sets_completed JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PATIENT_GUIDELINES
CREATE TABLE IF NOT EXISTS patient_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  recommended_supplements TEXT,
  manipulated_supplements TEXT,
  free_meal_video_url TEXT,
  general_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. TABELAS DE TEMPLATES
-- =============================================

-- DIET_TEMPLATES
CREATE TABLE IF NOT EXISTS diet_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  daily_calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fat_g INTEGER,
  water_goal_liters NUMERIC(3,1) DEFAULT 2.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DIET_TEMPLATE_MEALS
CREATE TABLE IF NOT EXISTS diet_template_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES diet_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  suggested_time TIME,
  order_index INTEGER DEFAULT 0
);

-- DIET_TEMPLATE_MEAL_FOODS
CREATE TABLE IF NOT EXISTS diet_template_meal_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_meal_id UUID NOT NULL REFERENCES diet_template_meals(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  unit_type TEXT DEFAULT 'gramas',
  quantity_units NUMERIC(10,2)
);

-- DIET_TEMPLATE_FOOD_SUBSTITUTIONS
CREATE TABLE IF NOT EXISTS diet_template_food_substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_food_id UUID NOT NULL REFERENCES diet_template_meal_foods(id) ON DELETE CASCADE,
  substitute_food TEXT NOT NULL,
  substitute_quantity TEXT NOT NULL
);

-- WORKOUT_TEMPLATES
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WORKOUT_TEMPLATE_DAYS
CREATE TABLE IF NOT EXISTS workout_template_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  workout_type TEXT
);

-- WORKOUT_TEMPLATE_EXERCISES
CREATE TABLE IF NOT EXISTS workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_day_id UUID NOT NULL REFERENCES workout_template_days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER DEFAULT 3,
  reps TEXT DEFAULT '10-12',
  rest TEXT,
  weight_kg NUMERIC(5,2),
  video_url TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  technique_id TEXT,
  effort_parameter_id TEXT
);

-- FOOD_EQUIVALENCE_GROUPS
CREATE TABLE IF NOT EXISTS food_equivalence_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FOOD_EQUIVALENCES
CREATE TABLE IF NOT EXISTS food_equivalences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES food_equivalence_groups(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity_grams INTEGER NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. TABELAS DE PAGAMENTO
-- =============================================

-- PAYMENT_SETTINGS
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  active_gateway VARCHAR(20) DEFAULT 'none',
  mp_access_token TEXT,
  mp_public_key TEXT,
  asaas_api_key TEXT,
  asaas_environment VARCHAR(10) DEFAULT 'sandbox',
  ps_email TEXT,
  ps_token TEXT,
  pm_api_key TEXT,
  pm_encryption_key TEXT,
  pix_enabled BOOLEAN DEFAULT true,
  boleto_enabled BOOLEAN DEFAULT true,
  credit_card_enabled BOOLEAN DEFAULT true,
  checkout_slug VARCHAR(50) UNIQUE,
  checkout_title TEXT DEFAULT 'Plano de Acompanhamento',
  checkout_description TEXT,
  checkout_success_message TEXT DEFAULT 'Pagamento realizado com sucesso! Você receberá um email com suas credenciais de acesso.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTION_PLANS
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30,
  price_cents INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id),
  client_id UUID REFERENCES profiles(id),
  plan_id UUID REFERENCES subscription_plans(id),
  gateway VARCHAR(20) NOT NULL,
  gateway_payment_id VARCHAR(255),
  amount_cents INTEGER NOT NULL,
  payment_method VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_cpf VARCHAR(14),
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  pix_expiration TIMESTAMPTZ,
  boleto_url TEXT,
  boleto_barcode TEXT,
  boleto_expiration DATE,
  card_last_digits VARCHAR(4),
  card_brand VARCHAR(20),
  installments INTEGER DEFAULT 1,
  paid_at TIMESTAMPTZ,
  webhook_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. APP_SETTINGS (WHITELABEL)
-- =============================================

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name VARCHAR(100) DEFAULT 'NutriApp',
  app_short_name VARCHAR(20) DEFAULT 'NutriApp',
  app_description TEXT DEFAULT 'App de acompanhamento nutricional e treinos',
  color_primary VARCHAR(7) DEFAULT '#1c4c9b',
  color_primary_hover VARCHAR(7) DEFAULT '#153a75',
  color_primary_light VARCHAR(30) DEFAULT 'rgba(28, 76, 155, 0.1)',
  color_secondary VARCHAR(7) DEFAULT '#263066',
  color_accent VARCHAR(7) DEFAULT '#f3985b',
  color_accent_hover VARCHAR(7) DEFAULT '#e07d3a',
  color_accent_light VARCHAR(30) DEFAULT 'rgba(243, 152, 91, 0.1)',
  color_text_primary VARCHAR(7) DEFAULT '#080d15',
  color_text_secondary VARCHAR(7) DEFAULT '#4a5568',
  color_bg_main VARCHAR(7) DEFAULT '#f5f7fa',
  color_bg_card VARCHAR(7) DEFAULT '#ffffff',
  logo_main_url TEXT DEFAULT NULL,
  logo_icon_url TEXT DEFAULT NULL,
  favicon_url TEXT DEFAULT NULL,
  pwa_theme_color VARCHAR(7) DEFAULT '#1c4c9b',
  pwa_background_color VARCHAR(7) DEFAULT '#f5f7fa',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuracao padrao
INSERT INTO app_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM app_settings LIMIT 1);

-- =============================================
-- 6. INDICES
-- =============================================

-- Diet/Meals
CREATE INDEX IF NOT EXISTS idx_diet_plans_client ON diet_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_meals_diet_plan ON meals(diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_foods_meal ON meal_foods(meal_id);
CREATE INDEX IF NOT EXISTS idx_food_substitutions_plan ON food_substitutions(diet_plan_id);

-- Workouts
CREATE INDEX IF NOT EXISTS idx_workout_plans_client ON workout_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_daily_workouts_plan ON daily_workouts(workout_plan_id);
CREATE INDEX IF NOT EXISTS idx_exercises_daily_workout ON exercises(daily_workout_id);

-- Progress
CREATE INDEX IF NOT EXISTS idx_daily_progress_client ON daily_progress(client_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_client ON weight_history(client_id);

-- Extra meals
CREATE INDEX IF NOT EXISTS idx_extra_meals_client ON extra_meals(client_id);
CREATE INDEX IF NOT EXISTS idx_extra_meal_foods_meal ON extra_meal_foods(extra_meal_id);

-- Exercise logs
CREATE INDEX IF NOT EXISTS idx_exercise_logs_client ON exercise_logs(client_id);

-- Templates
CREATE INDEX IF NOT EXISTS idx_diet_template_meals_template_id ON diet_template_meals(template_id);
CREATE INDEX IF NOT EXISTS idx_diet_template_meal_foods_meal_id ON diet_template_meal_foods(template_meal_id);
CREATE INDEX IF NOT EXISTS idx_template_food_subs_food_id ON diet_template_food_substitutions(template_food_id);
CREATE INDEX IF NOT EXISTS idx_workout_template_days_template_id ON workout_template_days(template_id);
CREATE INDEX IF NOT EXISTS idx_workout_template_exercises_day_id ON workout_template_exercises(template_day_id);

-- Food equivalences
CREATE INDEX IF NOT EXISTS idx_food_equivalences_group ON food_equivalences(group_id);
CREATE INDEX IF NOT EXISTS idx_food_equivalences_name ON food_equivalences(food_name);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payment_settings_slug ON payment_settings(checkout_slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_owner ON subscription_plans(owner_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_payments_owner ON payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_id ON payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- =============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_meal_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabela_taco ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_template_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_template_meal_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_template_food_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_equivalence_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_equivalences ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. POLICIES - PROFILES
-- =============================================

CREATE POLICY "Admins can read all profiles" ON profiles
FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (auth.uid() = id OR is_admin());

CREATE POLICY "Admins can insert profiles" ON profiles
FOR INSERT WITH CHECK (is_admin() OR auth.uid() = id);

CREATE POLICY "Admins can delete profiles" ON profiles
FOR DELETE USING (is_admin());

-- =============================================
-- 9. POLICIES - CLIENT DATA
-- =============================================

-- ANAMNESIS
CREATE POLICY "Users read own anamnesis" ON anamnesis
FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Admins manage anamnesis" ON anamnesis
FOR ALL USING (is_admin());

-- DIET_PLANS
CREATE POLICY "Users read own diet plans" ON diet_plans
FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Admins manage diet plans" ON diet_plans
FOR ALL USING (is_admin());

-- MEALS
CREATE POLICY "Users read own meals" ON meals
FOR SELECT USING (
  EXISTS (SELECT 1 FROM diet_plans WHERE id = meals.diet_plan_id AND client_id = auth.uid())
);

CREATE POLICY "Admins manage meals" ON meals
FOR ALL USING (is_admin());

-- MEAL_FOODS
CREATE POLICY "Users read own meal foods" ON meal_foods
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM meals
    JOIN diet_plans ON diet_plans.id = meals.diet_plan_id
    WHERE meals.id = meal_foods.meal_id AND diet_plans.client_id = auth.uid()
  )
);

CREATE POLICY "Admins manage meal foods" ON meal_foods
FOR ALL USING (is_admin());

-- FOOD_SUBSTITUTIONS
CREATE POLICY "Users read own substitutions" ON food_substitutions
FOR SELECT USING (
  EXISTS (SELECT 1 FROM diet_plans WHERE id = food_substitutions.diet_plan_id AND client_id = auth.uid())
);

CREATE POLICY "Admins manage substitutions" ON food_substitutions
FOR ALL USING (is_admin());

-- WORKOUT_PLANS
CREATE POLICY "Users read own workouts" ON workout_plans
FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Admins manage workouts" ON workout_plans
FOR ALL USING (is_admin());

-- DAILY_WORKOUTS
CREATE POLICY "Users read own daily workouts" ON daily_workouts
FOR SELECT USING (
  EXISTS (SELECT 1 FROM workout_plans WHERE id = daily_workouts.workout_plan_id AND client_id = auth.uid())
);

CREATE POLICY "Admins manage daily workouts" ON daily_workouts
FOR ALL USING (is_admin());

-- EXERCISES
CREATE POLICY "Users read own exercises" ON exercises
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM daily_workouts
    JOIN workout_plans ON workout_plans.id = daily_workouts.workout_plan_id
    WHERE daily_workouts.id = exercises.daily_workout_id AND workout_plans.client_id = auth.uid()
  )
);

CREATE POLICY "Admins manage exercises" ON exercises
FOR ALL USING (is_admin());

-- DAILY_PROGRESS
CREATE POLICY "Users manage own progress" ON daily_progress
FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "Admins manage progress" ON daily_progress
FOR ALL USING (is_admin());

-- WEIGHT_HISTORY
CREATE POLICY "Users manage own weight" ON weight_history
FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "Admins manage weight" ON weight_history
FOR ALL USING (is_admin());

-- EXTRA_MEALS
CREATE POLICY "Users manage own extra meals" ON extra_meals
FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "Admins manage extra meals" ON extra_meals
FOR ALL USING (is_admin());

-- EXTRA_MEAL_FOODS
CREATE POLICY "Users manage own extra meal foods" ON extra_meal_foods
FOR ALL USING (
  EXISTS (SELECT 1 FROM extra_meals WHERE id = extra_meal_foods.extra_meal_id AND client_id = auth.uid())
);

CREATE POLICY "Admins manage extra meal foods" ON extra_meal_foods
FOR ALL USING (is_admin());

-- EXERCISE_LOGS
CREATE POLICY "Users manage own logs" ON exercise_logs
FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "Admins manage logs" ON exercise_logs
FOR ALL USING (is_admin());

-- PATIENT_GUIDELINES
CREATE POLICY "Users read own guidelines" ON patient_guidelines
FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Admins manage guidelines" ON patient_guidelines
FOR ALL USING (is_admin());

-- =============================================
-- 10. POLICIES - PUBLIC READ TABLES
-- =============================================

CREATE POLICY "Anyone can read tabela_taco" ON tabela_taco
FOR SELECT USING (true);

CREATE POLICY "Admins manage tabela_taco" ON tabela_taco
FOR ALL USING (is_admin());

CREATE POLICY "Anyone can read food_metadata" ON food_metadata
FOR SELECT USING (true);

CREATE POLICY "Admins manage food_metadata" ON food_metadata
FOR ALL USING (is_admin());

CREATE POLICY "Anyone can read exercise_library" ON exercise_library
FOR SELECT USING (true);

CREATE POLICY "Admins manage exercise_library" ON exercise_library
FOR ALL USING (is_admin());

-- =============================================
-- 11. POLICIES - TEMPLATES (admin only)
-- =============================================

CREATE POLICY "Admins can manage diet templates" ON diet_templates
FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage diet template meals" ON diet_template_meals
FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage diet template meal foods" ON diet_template_meal_foods
FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage template food substitutions" ON diet_template_food_substitutions
FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage workout templates" ON workout_templates
FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage workout template days" ON workout_template_days
FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage workout template exercises" ON workout_template_exercises
FOR ALL USING (is_admin());

-- =============================================
-- 12. POLICIES - FOOD EQUIVALENCES
-- =============================================

CREATE POLICY "Everyone can read food equivalence groups" ON food_equivalence_groups
FOR SELECT USING (true);

CREATE POLICY "Everyone can read food equivalences" ON food_equivalences
FOR SELECT USING (true);

CREATE POLICY "Admins can manage food equivalence groups" ON food_equivalence_groups
FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage food equivalences" ON food_equivalences
FOR ALL USING (is_admin());

-- =============================================
-- 13. POLICIES - PAYMENT SYSTEM
-- =============================================

-- Payment Settings
CREATE POLICY "Admin manages own payment settings" ON payment_settings
FOR ALL USING (
  auth.uid() = owner_id AND is_admin()
);

CREATE POLICY "Public read settings by slug" ON payment_settings
FOR SELECT USING (checkout_slug IS NOT NULL);

-- Subscription Plans
CREATE POLICY "Admin manages own plans" ON subscription_plans
FOR ALL USING (
  auth.uid() = owner_id AND is_admin()
);

CREATE POLICY "Public read active plans" ON subscription_plans
FOR SELECT USING (is_active = true);

-- Payments
CREATE POLICY "Admin manages own payments" ON payments
FOR ALL USING (
  auth.uid() = owner_id AND is_admin()
);

CREATE POLICY "Client reads own payments" ON payments
FOR SELECT USING (auth.uid() = client_id);

-- =============================================
-- 14. POLICIES - APP SETTINGS
-- =============================================

CREATE POLICY "Anyone can read app_settings" ON app_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can update app_settings" ON app_settings
FOR UPDATE USING (is_admin());

-- =============================================
-- 15. TRIGGERS
-- =============================================

-- Profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Diet plans
DROP TRIGGER IF EXISTS update_diet_plans_updated_at ON diet_plans;
CREATE TRIGGER update_diet_plans_updated_at
  BEFORE UPDATE ON diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Workout plans
DROP TRIGGER IF EXISTS update_workout_plans_updated_at ON workout_plans;
CREATE TRIGGER update_workout_plans_updated_at
  BEFORE UPDATE ON workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Patient guidelines
DROP TRIGGER IF EXISTS update_patient_guidelines_updated_at ON patient_guidelines;
CREATE TRIGGER update_patient_guidelines_updated_at
  BEFORE UPDATE ON patient_guidelines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Payment settings
DROP TRIGGER IF EXISTS update_payment_settings_updated_at ON payment_settings;
CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Subscription plans
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Payments
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- App settings
DROP TRIGGER IF EXISTS app_settings_updated_at ON app_settings;
CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Diet templates
DROP TRIGGER IF EXISTS update_diet_templates_updated_at ON diet_templates;
CREATE TRIGGER update_diet_templates_updated_at
  BEFORE UPDATE ON diet_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_template_updated_at();

-- Workout templates
DROP TRIGGER IF EXISTS update_workout_templates_updated_at ON workout_templates;
CREATE TRIGGER update_workout_templates_updated_at
  BEFORE UPDATE ON workout_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_template_updated_at();

-- Food metadata
DROP TRIGGER IF EXISTS update_food_metadata_updated_at ON food_metadata;
CREATE TRIGGER update_food_metadata_updated_at
  BEFORE UPDATE ON food_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 16. HELPER FUNCTIONS
-- =============================================

-- Get checkout settings by slug
CREATE OR REPLACE FUNCTION get_checkout_by_slug(slug TEXT)
RETURNS TABLE (
  owner_id UUID,
  checkout_title TEXT,
  checkout_description TEXT,
  checkout_success_message TEXT,
  active_gateway VARCHAR(20),
  pix_enabled BOOLEAN,
  boleto_enabled BOOLEAN,
  credit_card_enabled BOOLEAN,
  mp_public_key TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.owner_id,
    ps.checkout_title,
    ps.checkout_description,
    ps.checkout_success_message,
    ps.active_gateway,
    ps.pix_enabled,
    ps.boleto_enabled,
    ps.credit_card_enabled,
    ps.mp_public_key
  FROM payment_settings ps
  WHERE ps.checkout_slug = slug
  AND ps.active_gateway != 'none';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get checkout plans
CREATE OR REPLACE FUNCTION get_checkout_plans(p_owner_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  description TEXT,
  duration_days INTEGER,
  price_cents INTEGER,
  features JSONB,
  is_featured BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.name,
    sp.description,
    sp.duration_days,
    sp.price_cents,
    sp.features,
    sp.is_featured
  FROM subscription_plans sp
  WHERE sp.owner_id = p_owner_id
  AND sp.is_active = true
  ORDER BY sp.display_order ASC, sp.price_cents ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 17. STORAGE BUCKET
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access for branding" ON storage.objects
FOR SELECT USING (bucket_id = 'branding');

CREATE POLICY "Admins can upload branding assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'branding' AND is_admin()
);

CREATE POLICY "Admins can update branding assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'branding' AND is_admin()
);

CREATE POLICY "Admins can delete branding assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'branding' AND is_admin()
);

-- =============================================
-- 18. COMMENTS
-- =============================================

COMMENT ON TABLE profiles IS 'User profiles with roles (admin/client)';
COMMENT ON TABLE anamnesis IS 'Medical/health questionnaire per client';
COMMENT ON TABLE diet_plans IS 'Diet plans assigned to clients';
COMMENT ON TABLE meals IS 'Meals within diet plans';
COMMENT ON TABLE meal_foods IS 'Foods in each meal with quantities';
COMMENT ON TABLE food_substitutions IS 'Alternative food options for diet plans';
COMMENT ON TABLE workout_plans IS 'Workout plans assigned to clients';
COMMENT ON TABLE daily_workouts IS 'Individual workout days';
COMMENT ON TABLE exercises IS 'Exercises in each workout day';
COMMENT ON TABLE exercise_library IS 'Library of available exercises';
COMMENT ON TABLE daily_progress IS 'Daily tracking of meals and exercises';
COMMENT ON TABLE weight_history IS 'Weight measurements over time';
COMMENT ON TABLE tabela_taco IS 'Brazilian TACO nutrition database';
COMMENT ON TABLE food_metadata IS 'Extended food info linked to TACO';
COMMENT ON TABLE extra_meals IS 'Ad-hoc meals added by users';
COMMENT ON TABLE extra_meal_foods IS 'Foods in extra meals';
COMMENT ON TABLE exercise_logs IS 'Exercise performance records';
COMMENT ON TABLE patient_guidelines IS 'Supplements and guidelines per client';
COMMENT ON TABLE payment_settings IS 'Gateway configuration per admin';
COMMENT ON TABLE subscription_plans IS 'Subscription plans with pricing';
COMMENT ON TABLE payments IS 'Transaction history for all payments';
COMMENT ON TABLE app_settings IS 'Whitelabel branding and theme settings';
