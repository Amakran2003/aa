import type { Market } from "@aa/contracts";

const SITES: Record<Exclude<Market, "autre">, { name: string; logo: string }> = {
  "made-in-china": {
    name: "Made-in-China",
    logo: "https://www.google.com/s2/favicons?domain=made-in-china.com&sz=64",
  },
  alibaba: {
    name: "Alibaba",
    logo: "https://www.google.com/s2/favicons?domain=alibaba.com&sz=64",
  },
  dhgate: {
    name: "DHgate",
    logo: "https://www.google.com/s2/favicons?domain=dhgate.com&sz=64",
  },
};

export function SiteMark({ source }: { source: Market }) {
  if (source === "autre") return null;
  const site = SITES[source];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gris">
      <img src={site.logo} alt="" width={16} height={16} className="h-4 w-4" />
      {site.name}
    </span>
  );
}
