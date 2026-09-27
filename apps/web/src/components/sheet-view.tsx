import type { ProductSheet } from "@aa/contracts";
import { Carousel } from "@/components/carousel";
import { Categories } from "@/components/categories";
import { FactoryMarks } from "@/components/factory-marks";
import { SiteMark } from "@/components/site-mark";

function closeTitle(title: string): boolean {
  const multi = /dual[\s-]*motor|double[\s-]*motor|two[\s-]*motor|twin[\s-]*motor|four[\s-]*motor|\b[24]\s*motors?\b/i.test(title);
  if (!multi) return false;
  const loads = [...title.matchAll(/(\d{2,3})\s?kg/gi)].map((match) => Number(match[1]));
  return loads.length === 0 || Math.max(...loads) >= 100;
}

const HIGHLIGHTS = [
  ["Prix", "Prix"],
  ["MOQ", "MOQ"],
  ["Package Size", "Carton"],
  ["Package Gross Weight", "Poids"],
  ["Model NO.", "Modèle"],
] as const;

export function SheetView({
  sheet,
  density,
  activeHref,
  onOpen,
  part,
  lists,
}: {
  sheet: ProductSheet;
  density: "full" | "short";
  activeHref: string | null;
  onOpen: (href: string) => void;
  part: "produit" | "fiche";
  lists: boolean;
}) {
  const hero = sheet.images[0];
  const seen = new Set<string>([sheet.url]);
  const closeOffers = (sheet.offers ?? []).filter((offer) => (typeof offer.close === "boolean" ? offer.close : closeTitle(offer.title)));
  const wideOffers = (sheet.offers ?? []).filter((offer) => !(typeof offer.close === "boolean" ? offer.close : closeTitle(offer.title)));
  const similar = [
    ...sheet.related.filter((item) => item.similar === true || closeTitle(item.title)),
    ...closeOffers.map((offer) => ({
      title: offer.title,
      price: offer.price,
      href: offer.href,
      image: offer.image,
      similar: true as const,
      supplier: offer.supplier,
      source: offer.source,
    })),
  ].filter((item) => {
    if (!item.href || seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
  const explore = [
    ...sheet.related.filter((item) => item.similar !== true && !closeTitle(item.title)),
    ...wideOffers.map((offer) => ({
      title: offer.title,
      price: offer.price,
      href: offer.href,
      image: offer.image,
      similar: false as const,
      supplier: offer.supplier,
      source: offer.source,
    })),
  ].filter((item) => {
    if (!item.href || seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });

  const showLists = part === "produit" && lists;

  return (
    <section className="cut w-full border border-white/70 bg-blanc/70 p-6 backdrop-blur-xl">
      {part === "produit" ? <h2 className="mb-4 text-lg font-bold text-encre">Voici le produit</h2> : null}
      {hero ? (
        <img src={hero} alt="" className={`cut mb-4 w-full object-cover ${density === "short" ? "h-28" : "h-52"}`} />
      ) : null}
      <SiteMark source={sheet.source} />
      {part === "produit" ? (
        <h3 className="mt-2 text-xl font-bold tracking-tight text-encre">{sheet.title ?? "Sans titre"}</h3>
      ) : (
        <h2 className="mt-2 text-xl font-bold tracking-tight text-encre">{sheet.title ?? "Sans titre"}</h2>
      )}
      {sheet.supplier ? <p className="mt-1 text-sm text-gris">{sheet.supplier}</p> : null}
      {density === "full" && sheet.description ? <p className="mt-3 text-sm text-encre">{sheet.description}</p> : null}

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {HIGHLIGHTS.map(([label, title]) => {
          const value = sheet.fields.find((field) => field.label === label)?.value;
          return (
            <div key={label} className="cut border border-[var(--abk-bordure-clair)] bg-blanc/80 px-3 py-2">
              <dt className="text-xs font-medium text-gris">{title}</dt>
              <dd className={label === "Prix" ? "mt-1 text-lg font-bold text-encre" : "mt-1 text-sm font-semibold text-encre"}>
                {value ?? "Absent"}
              </dd>
            </div>
          );
        })}
      </dl>

      {density === "full" && sheet.groups.length > 0 ? <Categories sheet={sheet} /> : null}
      <FactoryMarks factory={sheet.factory} />
      {part === "produit" && !showLists ? <p className="mt-6 text-sm text-gris">Je cherche les modèles proches.</p> : null}
      {showLists && similar.length === 0 && explore.length === 0 ? (
        <p className="mt-6 text-sm text-gris">Aucun modèle proche pour l'instant.</p>
      ) : null}
      {showLists && similar.length > 0 ? (
        <Carousel title="Modèles similaires" items={similar} source={sheet.source} activeHref={activeHref} onOpen={onOpen} />
      ) : null}
      {showLists && explore.length > 0 ? (
        <Carousel
          title="Autres produits à explorer"
          items={explore}
          source={sheet.source}
          activeHref={activeHref}
          onOpen={onOpen}
        />
      ) : null}
    </section>
  );
}
