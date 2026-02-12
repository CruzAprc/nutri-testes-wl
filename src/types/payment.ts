import type { Profile } from './profile';

export type PaymentGateway = 'none' | 'mercado_pago' | 'asaas' | 'pagseguro' | 'pagarme';
export type PaymentMethod = 'pix' | 'boleto' | 'credit_card';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'refunded';
export type AsaasEnvironment = 'sandbox' | 'production';

export interface PaymentSettings {
  id: string;
  owner_id: string;

  // Active gateway selection
  active_gateway: PaymentGateway;

  // Mercado Pago credentials
  mp_access_token: string | null;
  mp_public_key: string | null;

  // Asaas credentials
  asaas_api_key: string | null;
  asaas_environment: AsaasEnvironment;

  // PagSeguro credentials
  ps_email: string | null;
  ps_token: string | null;

  // Pagar.me credentials
  pm_api_key: string | null;
  pm_encryption_key: string | null;

  // Payment methods enabled
  pix_enabled: boolean;
  boleto_enabled: boolean;
  credit_card_enabled: boolean;

  // Public checkout configuration
  checkout_slug: string | null;
  checkout_title: string;
  checkout_description: string | null;
  checkout_success_message: string;

  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  duration_days: number;
  price_cents: number;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  owner_id: string;
  client_id: string | null;
  plan_id: string | null;

  // Gateway info
  gateway: PaymentGateway;
  gateway_payment_id: string | null;

  // Payment details
  amount_cents: number;
  payment_method: PaymentMethod | null;
  status: PaymentStatus;

  // Customer info
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  customer_cpf: string | null;

  // PIX specific
  pix_qr_code: string | null;
  pix_qr_code_base64: string | null;
  pix_expiration: string | null;

  // Boleto specific
  boleto_url: string | null;
  boleto_barcode: string | null;
  boleto_expiration: string | null;

  // Credit card specific
  card_last_digits: string | null;
  card_brand: string | null;
  installments: number;

  // Tracking
  paid_at: string | null;
  webhook_data: Record<string, unknown> | null;
  error_message: string | null;

  created_at: string;
  updated_at: string;
}

// Payment with related data for display
export interface PaymentWithPlan extends Payment {
  plan?: SubscriptionPlan;
  client?: Profile;
}
