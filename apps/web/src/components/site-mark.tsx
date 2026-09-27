import type { Market } from "@aa/contracts";

const SITES: Record<Exclude<Market, "autre">, { name: string; host: string }> = {
  "made-in-china": { name: "Made-in-China", host: "www.made-in-china.com" },
  alibaba: { name: "Alibaba", host: "www.alibaba.com" },
  dhgate: { name: "DHgate", host: "www.dhgate.com" },
};

export function SiteMark({ source }: { source: Market }) {
  if (source === "autre") return null;
  const site = SITES[source];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gris">
      <img src={`https://${site.host}/favicon.ico`} alt="" width={16} height={16} className="h-4 w-4" />
      {site.name}
    </span>
  );
}
