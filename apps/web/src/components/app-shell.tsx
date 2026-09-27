import type { ReactNode } from "react";

export function AppShell({ children, header }: { children: ReactNode; header?: ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link cut" href="#contenu">
        Aller au contenu
      </a>
      <div className="app-board">
        {header}
        <main id="contenu" className="flex min-h-0 flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
