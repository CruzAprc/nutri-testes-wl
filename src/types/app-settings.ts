export interface AppSettings {
  id: string;

  // Identidade do App
  app_name: string;
  app_short_name: string;
  app_description: string;

  // Cores Primarias
  color_primary: string;
  color_primary_hover: string;
  color_primary_light: string;

  // Cores Secundarias
  color_secondary: string;

  // Cores de Destaque (Accent)
  color_accent: string;
  color_accent_hover: string;
  color_accent_light: string;

  // Cores de Texto
  color_text_primary: string;
  color_text_secondary: string;

  // Cores de Fundo
  color_bg_main: string;
  color_bg_card: string;

  // URLs dos Logos
  logo_main_url: string | null;
  logo_icon_url: string | null;
  favicon_url: string | null;

  // PWA
  pwa_theme_color: string;
  pwa_background_color: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export const DEFAULT_APP_SETTINGS: Omit<AppSettings, 'id' | 'created_at' | 'updated_at'> = {
  app_name: 'Michael Cezar Nutricionista',
  app_short_name: 'MC Nutri',
  app_description: 'App de acompanhamento nutricional e treinos',
  color_primary: '#1c4c9b',
  color_primary_hover: '#153a75',
  color_primary_light: 'rgba(28, 76, 155, 0.1)',
  color_secondary: '#263066',
  color_accent: '#f3985b',
  color_accent_hover: '#e07d3a',
  color_accent_light: 'rgba(243, 152, 91, 0.1)',
  color_text_primary: '#080d15',
  color_text_secondary: '#4a5568',
  color_bg_main: '#f5f7fa',
  color_bg_card: '#ffffff',
  logo_main_url: null,
  logo_icon_url: null,
  favicon_url: null,
  pwa_theme_color: '#1c4c9b',
  pwa_background_color: '#f5f7fa',
};
