import type { BestOffer, FactoryCard, Offer, ProductSheet, Rates } from "@aa/contracts";

const RATES: Rates = { base: "EUR", date: "2026-09-25", values: { CNY: 7.6551, USD: 1.1403 } };

export const DEMO_BUDGET = 10_000;

export const DEMO_URL =
  "https://kenofurniture.en.made-in-china.com/product/fUCYLgFAHBhP/China-Double-Person-Four-Motors-Workstation-Office-Height-Adjustable-Electric-Lifting-Computer-Table.html";

const HUASHENG = "https://www.alibaba.com/product-detail/Modern-D12-Dual-Motor-Ergonomic-Standing_1601577820869.html";
const OFITECH = "https://www.alibaba.com/product-detail/Office-Furniture-Dual-Motor-Electric-Standing_11000036179372.html";

export const DEMO_FACTORY = HUASHENG;

const EMPTY_FACTORY: FactoryCard = {
  city: null,
  place: null,
  role: null,
  member: null,
  memberSince: null,
  rating: null,
  audited: false,
};

function sheet(partial: Pick<ProductSheet, "source" | "url" | "title" | "supplier" | "images" | "fields" | "factory"> & Partial<ProductSheet>): ProductSheet {
  return {
    description: null,
    groups: [],
    traits: [],
    laterNotes: [],
    related: [],
    offers: [],
    probes: [],
    tiers: [],
    rates: RATES,
    sample: null,
    searchVersion: 2,
    ...partial,
  };
}

const huasheng = sheet({
  source: "alibaba",
  url: HUASHENG,
  title: "Modern D12 Dual Motor Ergonomic Standing Desk Electric Table Motorized Lift Height-adjustable Desk For Home/office Use",
  supplier: "Ningbo Huasheng Ergonomic Technology Co., Ltd.",
  images: [
    "https://s.alicdn.com/@sc04/kf/H5d7eb67d4ffe4ee69fbef2c3ea2a99bcO.png_960x960q80.jpg",
    "https://s.alicdn.com/@sc04/kf/H86a27e98c9a948b486dbe59aad7cb5d1F.png_960x960q80.jpg",
  ],
  fields: [
    { label: "Prix", value: "€54.17 - €67.48" },
    { label: "MOQ", value: "1 pieces" },
    { label: "Package Size", value: "125X36X15 cm" },
    { label: "Package Gross Weight", value: "21.000 kg" },
    { label: "Model NO.", value: "D12" },
  ],
  factory: { city: "Ningbo", place: "Zhejiang", role: "fabricant", member: "Fournisseur", memberSince: "3 ans", rating: "5", audited: false },
  tiers: [
    { from: 1, to: 9, price: "€67.48" },
    { from: 10, to: 99, price: "€63.93" },
    { from: 100, to: 499, price: "€58.61" },
    { from: 500, to: null, price: "€54.17" },
  ],
  sample: {
    price: null,
    shipping: { amount: 30.77, currency: "EUR", quantity: 1, transit: "45 à 50 jours", method: "Ocean + Express via FLY Logistics", dutiesIncluded: false },
  },
});

const ofitech = sheet({
  source: "alibaba",
  url: OFITECH,
  title: "Office Furniture Dual Motor Electric Standing Desk Frame Height Adjustable Sit Standing Desk Workstation Pc Table Metal Frame",
  supplier: "Ningbo Ofitech Business Machines Co., Ltd.",
  images: [
    "https://s.alicdn.com/@sc04/kf/H8eaf585ffc7f4d6c959c98db80b1f121F.png_960x960q80.jpg",
    "https://s.alicdn.com/@sc04/kf/H971b942c9997424f945b8c8b73883f33Q.png_960x960q80.jpg",
  ],
  fields: [
    { label: "Prix", value: "€55.59 - €83.38" },
    { label: "MOQ", value: "2 pieces" },
    { label: "Package Size", value: "100X35X20 cm" },
    { label: "Package Gross Weight", value: "20.000 kg" },
    { label: "Model NO.", value: "ED9-F" },
  ],
  factory: { city: "Ningbo", place: "Zhejiang", role: "fabricant", member: "Fournisseur", memberSince: "14 ans", rating: null, audited: false },
  tiers: [
    { from: 2, to: 99, price: "€83.38" },
    { from: 100, to: 499, price: "€65.62" },
    { from: 500, to: 999, price: "€60.65" },
    { from: 1000, to: null, price: "€55.59" },
  ],
  sample: {
    price: null,
    shipping: { amount: 58.61, currency: "EUR", quantity: 2, transit: "45 à 50 jours", method: "Ocean + Express via FLY Logistics", dutiesIncluded: false },
  },
});

function listed(offer: Offer): ProductSheet {
  return sheet({
    source: "alibaba",
    url: offer.href,
    title: offer.title,
    supplier: offer.supplier,
    images: offer.image ? [offer.image] : [],
    fields: [
      { label: "Prix", value: offer.price },
      { label: "MOQ", value: offer.moq },
    ],
    factory: { ...EMPTY_FACTORY, memberSince: offer.years ? `${offer.years} ans` : null },
  });
}

const listedOffers: Offer[] = [
  {
    title: "Ergonomic Modern Office Home Computer Lift Table Dual Motor Standing up Desk Electric Height Adjustable Sit Stand Desk Electric",
    price: "US $103.00-$128.00",
    moq: "2 sets",
    href: "https://www.alibaba.com/product-detail/Ergonomic-Modern-Office-Home-Computer-Lift_1601278327409.html",
    image: "https://s.alicdn.com/@sc04/kf/H174373eb14aa468d9d4cee7fa0330181I.jpg_300x300.jpg",
    supplier: "Shaoxing Contuo Transmission Technology Co., Ltd.",
    source: "alibaba",
    close: true,
    years: 8,
    verified: true,
    assurance: true,
    rating: 4.9,
    response: "97.9%",
    employees: 80,
    contact:
      "https://message.alibaba.com/msgsend/contact.htm?action=contact_action&appForm=s_en&chkProductIds=1601278327409&tracelog=contactOrg",
  },
  {
    title: "High-standard Double Motor Height Adjustable Electric Table Sit Standing Computer Office Desk",
    price: "US $115.59-$129.92",
    moq: "2 cartons",
    href: "https://www.alibaba.com/product-detail/High-standard-Double-Motor-Height-Adjustable_1600945575615.html",
    image: "https://s.alicdn.com/@sc04/kf/Hc017b42866914b5495f1b3ff4853654dI.jpg_300x300.jpg",
    supplier: "Foshan Beisijie Furniture Co., Ltd.",
    source: "alibaba",
    close: true,
    years: 7,
    verified: false,
    assurance: true,
    rating: 5,
    response: "93.8%",
    employees: null,
  },
  {
    title: "Dual Motor Electric Standing Desk - Height Adjustable Sit-Stand Desk with 120kg Load Capacity",
    price: "US $117.00-$132.00",
    moq: "2 sets",
    href: "https://www.alibaba.com/product-detail/Dual-Motor-Electric-Standing-Desk-Height_1601633828066.html",
    image: "https://s.alicdn.com/@sc04/kf/H02d06b2b977b4f0396ea10d1265590c7W.png_300x300.png",
    supplier: "Icon Workspace Co., Ltd.",
    source: "alibaba",
    close: true,
    years: 8,
    verified: true,
    assurance: true,
    rating: 5,
    response: "99.4%",
    employees: 10,
  },
];

function featured(factory: ProductSheet, years: number): Offer {
  return {
    title: factory.title ?? "",
    price: factory.fields.find((field) => field.label === "Prix")?.value ?? null,
    moq: factory.fields.find((field) => field.label === "MOQ")?.value ?? null,
    href: factory.url,
    image: factory.images[0] ?? null,
    supplier: factory.supplier,
    source: "alibaba",
    close: true,
    years,
    verified: factory.factory.audited,
  };
}

function bestOf(offer: Offer, low: number, high: number | null, currency: BestOffer["currency"]): BestOffer {
  return {
    href: offer.href,
    title: offer.title,
    image: offer.image,
    price: offer.price ?? "",
    low,
    high,
    currency,
    moq: offer.moq,
    supplier: offer.supplier,
    source: offer.source,
    years: offer.years ?? null,
    verified: offer.verified,
    assurance: offer.assurance,
    rating: offer.rating,
    response: offer.response,
    employees: offer.employees,
    contact: offer.contact,
  };
}

const featuredOffers = [featured(huasheng, 3), featured(ofitech, 14)];

const origin = sheet({
  source: "made-in-china",
  url: DEMO_URL,
  title: "Double Person Four Motors Workstation Office Height Adjustable Electric Lifting Computer Table",
  supplier: "Foshan Keno Furniture Co., Ltd.",
  images: [
    "https://image.made-in-china.com/2f0j00FAuepzQghWqh/Double-Person-Four-Motors-Workstation-Office-Height-Adjustable-Electric-Lifting-Computer-Table.webp",
    "https://image.made-in-china.com/2f0j00OJpezVTFrWbh/Double-Person-Four-Motors-Workstation-Office-Height-Adjustable-Electric-Lifting-Computer-Table.webp",
  ],
  fields: [
    { label: "Prix", value: "US$65.00-207.00" },
    { label: "MOQ", value: "10 Sets(MOQ)" },
    { label: "Model NO.", value: "GS3011" },
    { label: "HS Code", value: "9403300090" },
    { label: "Package Size", value: "65.00cm * 30.00cm * 20.00cm" },
    { label: "Package Gross Weight", value: "20.000kg" },
    { label: "Table Top", value: "Wood 1200-1800mm" },
    { label: "Warranty", value: "3 Years" },
    { label: "Product Name", value: "Height Adjustable Computer Desk" },
  ],
  factory: { city: null, place: null, role: null, member: "Diamond", memberSince: "2021", rating: "5.0", audited: true },
  offers: [...featuredOffers, ...listedOffers],
  probes: [
    { source: "made-in-china", state: "lu", count: 24 },
    { source: "alibaba", state: "lu", count: 144 },
    { source: "dhgate", state: "lu", count: 8 },
  ],
  best: [
    bestOf(featuredOffers[0], 54.17, 67.48, "EUR"),
    bestOf(featuredOffers[1], 55.59, 83.38, "EUR"),
    bestOf(listedOffers[0], 103, 128, "USD"),
  ],
});

const BY_URL = new Map<string, ProductSheet>([
  [origin.url, origin],
  [huasheng.url, huasheng],
  [ofitech.url, ofitech],
  ...listedOffers.map((offer) => [offer.href, listed(offer)] as const),
]);

export function demoSuppliers(): ProductSheet[] {
  return [...BY_URL.values()].filter((item) => item.url !== DEMO_URL);
}

export function demoSheet(url: string): ProductSheet | null {
  const key = url.split("?")[0];
  return BY_URL.get(key) ?? null;
}
