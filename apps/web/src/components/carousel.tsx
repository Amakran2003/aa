import type { Market, ProductSheet } from "@aa/contracts";
import { SiteMark } from "@/components/site-mark";

export function Carousel({
  title,
  items,
  source,
  activeHref,
  onOpen,
}: {
  title: string;
  items: (ProductSheet["related"][number] & { source?: Market })[];
  source: Market;
  activeHref: string | null;
  onOpen: (href: string) => void;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-encre">{title}</h3>
      <ul className="carousel mt-3">
        {items.map((item) => (
          <li key={item.href ?? item.title} className="cut w-44 shrink-0 overflow-hidden border border-[var(--abk-bordure-clair)] bg-blanc">
            {item.href ? (
              <button
                type="button"
                aria-pressed={activeHref === item.href}
                onClick={() => onOpen(item.href as string)}
                className="block w-full text-left"
              >
                {item.image ? <img src={item.image} alt="" className="h-28 w-full object-cover" /> : null}
                <span className="block px-3 pt-2">
                  <SiteMark source={item.source ?? source} />
                </span>
                <span className="block px-3 py-2 text-sm text-encre">{item.title}</span>
                <span className="block px-3 pb-3 text-base font-bold text-encre">{item.price ?? "Prix absent"}</span>
              </button>
            ) : (
              <div>
                {item.image ? <img src={item.image} alt="" className="h-28 w-full object-cover" /> : null}
                <p className="px-3 py-2 text-sm text-encre">{item.title}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
