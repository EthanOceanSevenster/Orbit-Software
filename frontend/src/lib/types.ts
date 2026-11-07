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
