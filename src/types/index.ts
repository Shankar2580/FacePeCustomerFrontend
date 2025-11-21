// Type definitions
export interface User {
  id: string;
  email: string;
  business_name: string;
  mobile_number: string;
  mobile_verified: boolean;
  stripe_account_status: string;
  payout_enabled: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  status: string;
  customer_name?: string;
  created_at: string;
  description?: string;
}

export interface PaymentRequest {
  request_id: string;
  user_id: string;
  face_scan_id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'DECLINED';
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}
