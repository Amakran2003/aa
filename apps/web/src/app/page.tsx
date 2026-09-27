import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookie } from "@aa/contracts";
import { openSession } from "@aa/core";
import { AppShell } from "@/components/app-shell";
import { logoutAction } from "@/features/auth/actions";
import { ProductAsk } from "@/features/fiche/product-ask";

export const metadata: Metadata = {
  title: "Analyser un produit",
};

export default async function HomePage() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!openSession(token)) redirect("/connexion");

  return (
    <AppShell
      header={
        <header className="ask-stage-header">
          <form action={logoutAction}>
            <button type="submit" className="abk-bouton px-2 py-2 text-sm font-semibold text-encre">
              Sortir
            </button>
          </form>
        </header>
      }
    >
      <ProductAsk />
    </AppShell>
  );
}
