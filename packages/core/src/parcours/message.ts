export const ASK_QUANTITIES = [100, 300, 500] as const;

export function companyName(supplier: string | null): string | null {
  if (!supplier) return null;
  const name = supplier
    .replace(/\b(?:co\.?\s*,?\s*ltd\.?|company\s+limited|limited|ltd\.?|inc\.?|llc)\b/gi, " ")
    .replace(/[,.]+\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return name || null;
}

export function supplierMessage({ supplier, product }: { supplier: string | null; product: string }): string {
  const name = companyName(supplier);
  const [small, middle, large] = ASK_QUANTITIES;
  return `Dear ${name ? `${name} team` : "Sir or Madam"},

We are a French company preparing a new product line for the French market. We found your "${product}" and would like to work with you.

1- To assess your quality and speed, we would like a test quantity of 1 unit, sent to our forwarder. Can the sample cost be deducted from our first order?
2- Could you quote EXW and DDP France prices for ${small}, ${middle} and ${large} units?
3- Please share the carton size, gross weight, CBM and HS code per unit.
4- Do you hold CE and RoHS certifications, and are they included in the price?
5- What is your lead time, and your payment terms (30% before production, 70% after inspection)?
6- Do you accept Alibaba Trade Assurance and PayPal?

Kindly add me on WhatsApp or WeChat, and reply by email as well.
Eager to commence business with you.

[Prénom] – [Rôle] – [Marque]`;
}
