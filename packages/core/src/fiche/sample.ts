import type { SampleOffer, SampleShipping } from "@aa/contracts";
import { parseMoney } from "../money.ts";

type LogisticsOption = {
  isSelected?: boolean;
  price?: string;
  dollarPriceNumber?: number;
  deliveryDateText?: string;
  displayShippingType?: string;
};

type LogisticsData = {
  hasValidLogistics?: boolean;
  quantity?: string | number;
  tariffIncluded?: boolean;
  logisticGroup?: { list?: { innerFloor?: { data?: LogisticsOption } }[] }[];
};

function plain(html: string | undefined): string | null {
  const text = html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text || null;
}

function transitOf(raw: string | undefined): string | null {
  const text = plain(raw)?.replace(/^Transit time:\s*/i, "") ?? null;
  const range = text?.match(/(\d+)\s*-\s*(\d+)\s*days?/i);
  if (range) return `${range[1]} à ${range[2]} jours`;
  const single = text?.match(/(\d+)\s*days?/i);
  return single ? `${single[1]} jours` : text;
}

export function shippingOf(payload: unknown): SampleShipping | null {
  const data = (payload as { data?: LogisticsData } | null)?.data;
  if (!data?.hasValidLogistics) return null;
  const options = (data.logisticGroup ?? [])
    .flatMap((group) => group.list ?? [])
    .map((row) => row.innerFloor?.data)
    .filter((option): option is LogisticsOption => Boolean(option));
  const option = options.find((item) => item.isSelected) ?? options[0];
  if (!option) return null;
  const money = parseMoney(option.price);
  const amount = money?.low ?? option.dollarPriceNumber ?? null;
  if (!amount || amount <= 0) return null;
  const quantity = Number(data.quantity);
  return {
    amount,
    currency: money?.currency ?? "USD",
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    transit: transitOf(option.deliveryDateText),
    method: plain(option.displayShippingType),
    dutiesIncluded: data.tariffIncluded === true,
  };
}

export function samplePriceOf(html: string): string | null {
  const json = html.match(/"sampleInfo":\{"enable":true,"formatPrice":"([^"]+)"/)?.[1];
  if (json) return json;
  return html.match(/Sample price:?\s*((?:US\s*)?[$€]\s?[\d.,]+(?:\s*-\s*[\d.,]+)?)/i)?.[1]?.trim() ?? null;
}

export function sampleOf(html: string, logistics: unknown): SampleOffer {
  return { price: samplePriceOf(html), shipping: shippingOf(logistics) };
}
