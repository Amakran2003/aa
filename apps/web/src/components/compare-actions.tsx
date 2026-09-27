export function CompareActions({
  ready,
  onClose,
  onPromote,
}: {
  ready: boolean;
  onClose: () => void;
  onPromote: () => void;
}) {
  return (
    <div className="ask-side__bar">
      <button type="button" className="abk-bouton px-2 py-2 text-sm font-semibold text-encre" onClick={onClose}>
        Fermer
      </button>
      <button
        id="compare-switch"
        type="button"
        disabled={!ready}
        className="abk-bouton bg-marine px-4 py-2 text-sm font-bold text-blanc disabled:opacity-60"
        onClick={onPromote}
      >
        Passer à ce produit
      </button>
    </div>
  );
}

export function CompareStatus({ pending, error }: { pending: boolean; error: string | null }) {
  return (
    <>
      {pending ? (
        <p className="ask-retrieval" role="status">
          Lecture de la fiche
        </p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium text-erreur" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
