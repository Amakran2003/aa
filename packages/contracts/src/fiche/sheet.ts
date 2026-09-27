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
};
