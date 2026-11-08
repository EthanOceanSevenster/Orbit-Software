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
  /** Whether this login is the owner's, and so may open the dashboard. */
  is_staff?: boolean;
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

/** One client as the owner sees them on the dashboard. */
export type StaffClient = {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email: string;
  website_url: string;
  plan_name: string;
  monthly_total: string;
  currency: string;
  next_payment_date: string | null;
  status: "pending" | "active" | "paused" | "cancelled";
  status_label: string;
  services: string[];
  outstanding: string;
  invoice_count: number;
  open_requests: number;
  created_at: string;
};

export type StaffServiceRequest = ServiceRequest & {
  company_name: string;
  contact_email: string;
};

export type StaffOverview = {
  totals: {
    clients: number;
    by_status: Record<string, number>;
    monthly_recurring: string;
    outstanding: string;
    overdue_invoices: number;
    open_requests: number;
    currency: string;
  };
  clients: StaffClient[];
  requests: StaffServiceRequest[];
};
