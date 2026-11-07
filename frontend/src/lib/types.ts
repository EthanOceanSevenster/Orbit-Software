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
  status?: "pending" | "active" | "paused" | "cancelled";
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

/** Extra work a signed-in client has asked us for from inside the portal. */
export type ServiceRequest = {
  id: number;
  service: string;
  service_label: string;
  details: string;
  status: "new" | "quoted" | "accepted" | "declined" | "done";
  status_label: string;
  created_at: string;
};

/** The services a client can ask for. Mirrors ServiceRequest.Service in Django. */
export const SERVICE_OPTIONS: { value: string; label: string }[] = [
  { value: "website", label: "A website" },
  { value: "redesign", label: "Website redesign" },
  { value: "dashboard", label: "Live dashboard" },
  { value: "marketing", label: "Marketing" },
  { value: "ecommerce", label: "Online shop" },
  { value: "seo", label: "SEO and search" },
  { value: "business_email", label: "Business email address" },
  { value: "support", label: "Changes to my current site" },
  { value: "other", label: "Something else" },
];
