import type { FactoryCard, FactoryRole } from "@aa/contracts";
import { MarkIcon, type MarkName } from "@/icons/mark";

const ROLE_LABEL: Record<FactoryRole, string> = {
  fabricant: "Fabricant",
  trading: "Société de trading",
  "fabricant-et-trading": "Fabricant et société de trading",
};

export function FactoryMarks({ factory }: { factory: FactoryCard | undefined }) {
  if (!factory) return null;
  const marks = [
    factory.member
      ? {
          key: "member",
          icon: "diamond" as const,
          label: factory.memberSince ? `${factory.member} depuis ${factory.memberSince}` : factory.member,
        }
      : null,
    factory.rating ? { key: "rating", icon: "star" as MarkName, label: `Note ${factory.rating.replace(".", ",")}` } : null,
    factory.role ? { key: "role", icon: "factory" as const, label: ROLE_LABEL[factory.role] } : null,
    factory.city || factory.place
      ? {
          key: "place",
          icon: "pin" as const,
          label: [factory.city, factory.place, "Chine"].filter((part) => part).join(", "),
        }
      : null,
    factory.audited ? { key: "audit", icon: "shield" as const, label: "Auditée par un tiers" } : null,
  ].filter((mark) => mark !== null);

  if (marks.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-medium text-gris">Usine</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {marks.map((mark) => (
          <li
            key={mark.key}
            className="flex items-center gap-1.5 rounded-full bg-[var(--abk-brume)] px-3 py-1.5 text-sm font-medium text-encre"
          >
            <MarkIcon name={mark.icon} />
            {mark.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
