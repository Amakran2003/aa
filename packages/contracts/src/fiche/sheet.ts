export type SheetField = {
  label: string;
  value: string | null;
};

export type RelatedProduct = {
  title: string;
  price: string | null;
  href: string | null;
  image: string | null;
  similar: boolean | null;
};

export type FieldGroup = {
  name: string;
  labels: string[];
};

export type FactoryRole = "fabricant" | "trading" | "fabricant-et-trading";

export type FactoryCard = {
  city: string | null;
  place: string | null;
  role: FactoryRole | null;
  member: string | null;
  memberSince: string | null;
  rating: string | null;
  audited: boolean;
};

export type Market = "made-in-china" | "alibaba" | "dhgate" | "autre";

export type Offer = {
  title: string;
  price: string | null;
  moq: string | null;
  href: string;
  image: string | null;
  supplier: string | null;
  source: Market;
  close: boolean;
  years?: number | null;
} & SupplierSignals;

export type SupplierSignals = {
  verified?: boolean;
  assurance?: boolean;
  rating?: number | null;
  response?: string | null;
  employees?: number | null;
  contact?: string | null;
};

export const SEARCH_VERSION = 2;

export type PriceTier = {
  from: number;
  to: number | null;
  price: string;
};

export type Currency = "EUR" | "USD" | "CNY";

export type Rates = {
  base: "EUR";
  date: string;
  values: Partial<Record<Currency, number>>;
};

export type BestOffer = {
  href: string;
  title: string;
  image: string | null;
  price: string;
  low: number;
  high: number | null;
  currency: Currency;
  moq: string | null;
  supplier: string | null;
  source: Market;
  years: number | null;
} & SupplierSignals;

export type SampleShipping = {
  amount: number;
  currency: Currency;
  quantity: number;
  transit: string | null;
  method: string | null;
  dutiesIncluded: boolean;
};

export type SampleOffer = {
  price: string | null;
  shipping: SampleShipping | null;
};

export type MarketProbe = {
  source: Market;
  state: "lu" | "bloque" | "vide";
  count: number;
};

export type ProductSheet = {
  source: Market;
  url: string;
  title: string | null;
  supplier: string | null;
  images: string[];
  description: string | null;
  fields: SheetField[];
  groups: FieldGroup[];
  factory: FactoryCard;
  traits: string[];
  laterNotes: string[];
  related: RelatedProduct[];
  offers: Offer[];
  probes: MarketProbe[];
  tiers?: PriceTier[];
  best?: BestOffer[];
  rates?: Rates | null;
  sample?: SampleOffer | null;
  searchVersion?: number;
};
