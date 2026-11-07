export type Plan = {
  id?: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  setup_fee: number | string;
  monthly_fee: number | string;
  currency: string;
  features: string[];
  is_featured: boolean;
};

export type AddOn = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  monthly_fee: number | string;
  currency: string;
};

export type ClientAccount = {
  has_account: boolean;
  name?: string;
  company_name?: string;
  website_url?: string;
  plan_name?: string;
  monthly_total?: string;
  currency?: string;
  next_payment_date?: string | null;
  status?: "active" | "paused" | "cancelled";
  status_label?: string;
  services?: string[];
};

export type Invoice = {
  id: number;
  number: string;
  description: string;
  amount: string;
  currency: string;
  issued_on: string;
  due_on: string;
  status: "draft" | "due" | "paid" | "overdue" | "void";
  status_label: string;
  is_payable: boolean;
  paid_at: string | null;
};
