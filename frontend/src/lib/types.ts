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
  /** Once-off, charged on the first invoice. Absent or zero means none. */
  setup_fee?: number | string;
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
  /** Who we deal with and where an invoice is addressed. */
  contact_name?: string;
  billing_email?: string;
  phone?: string;
  address?: string;
  vat_number?: string;
  client_since?: string | null;
  /** Their own domain, and when we next renew it for them. */
  domain?: string;
  domain_renews_on?: string | null;
  /** Where to pay by EFT. Blank fields mean it is not configured yet. */
  pay_to?: {
    name: string;
    account_name: string;
    account_number: string;
    branch_code: string;
    company_name: string;
  };
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
  { value: "power_bi", label: "Power BI report" },
  { value: "automation", label: "Automate a manual job" },
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

/** An invoice as the owner sees it, with the client attached. */
export type StaffInvoice = {
  id: number;
  number: string;
  company_name: string;
  contact_email: string;
  description: string;
  amount: string;
  currency: string;
  issued_on: string;
  due_on: string;
  status: "draft" | "due" | "paid" | "overdue" | "void";
  status_label: string;
  paid_at: string | null;
};

export type StaffOverview = {
  totals: {
    clients: number;
    by_status: Record<string, number>;
    monthly_recurring: string;
    outstanding: string;
    overdue_invoices: number;
    open_requests: number;
    /** Money actually received, which is not the same as money billed. */
    received_total: string;
    received_this_month: string;
    payments_count: number;
    unpaid_invoices: number;
    currency: string;
  };
  clients: StaffClient[];
  requests: StaffServiceRequest[];
  payments: StaffInvoice[];
  unpaid: StaffInvoice[];
};

export type InvoiceLine = {
  description: string;
  quantity: string;
  unit_amount: string;
  amount: string;
};

/** One invoice in full, enough to render it as a document. */
export type InvoiceDocument = {
  id: number;
  number: string;
  description: string;
  amount: string;
  currency: string;
  issued_on: string;
  due_on: string;
  period_start: string | null;
  period_end: string | null;
  period_label: string;
  status: "draft" | "due" | "paid" | "overdue" | "void";
  status_label: string;
  is_payable: boolean;
  paid_at: string | null;
  lines: InvoiceLine[];
  billed_to: {
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
    vat_number: string;
  };
  issued_by: {
    company_name: string;
    location: string;
    email: string;
    website: string;
    vat_number: string;
    bank: {
      name: string;
      account_name: string;
      account_number: string;
      branch_code: string;
    };
  };
};

/**
 * A card the client has saved with Payfast.
 *
 * There is no card number here and never will be: Payfast holds the card and
 * hands us a token, which is all this describes.
 */
export type SavedCard = {
  has_card: boolean;
  saved_at: string | null;
  autopay: boolean;
  /** Payfast's own page for changing the card behind the token. */
  update_url: string;
  /** The exact words the client agreed to when they saved it. */
  consent_text: string;
};
