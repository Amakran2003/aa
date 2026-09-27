import type { Offer } from "@aa/contracts";
import { SiteMark } from "@/components/site-mark";

export function Offers({
  offers,
  activeHref,
  onOpen,
}: {
  offers: Offer[];
  activeHref: string | null;
  onOpen: (href: string) => void;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-encre">Autres usines</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {offers.map((offer) => (
          <li key={offer.href} className="cut border border-[var(--abk-bordure-clair)] bg-blanc">
            <button
              type="button"
              aria-pressed={activeHref === offer.href}
              onClick={() => onOpen(offer.href)}
              className="flex w-full gap-3 p-3 text-left"
            >
              {offer.image ? <img src={offer.image} alt="" className="h-16 w-24 shrink-0 object-cover" /> : null}
              <span className="min-w-0">
                <SiteMark source={offer.source} />
                <span className="mt-1 block text-sm font-medium text-encre">{offer.title}</span>
                <span className="mt-1 block text-base font-bold text-encre">{offer.price ?? "Prix absent"}</span>
                <span className="mt-1 block text-sm text-gris">
                  {[offer.supplier, offer.moq ?? "MOQ absent"].filter(Boolean).join(" · ")}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
