"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(loginAction, undefined as LoginState);
  const [visible, setVisible] = useState(false);

  return (
    <div className="cut border border-white/70 bg-blanc/70 p-8 backdrop-blur-xl">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-encre">Connexion</h1>

      {!configured ? (
        <p className="text-sm leading-relaxed text-gris" role="status">
          Renseigne <span className="text-encre">AUTH_SECRET</span> et{" "}
          <span className="text-encre">AA_ACCOUNTS</span> dans{" "}
          <span className="text-encre">.env.local</span>, puis relance.
        </p>
      ) : (
        <form action={action} className="space-y-5">
          <p className="text-sm text-gris">Tous les champs sont obligatoires.</p>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-encre">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              aria-invalid={state?.error ? true : undefined}
              aria-describedby={state?.error ? "login-error" : undefined}
              className="abk-bouton w-full border border-[var(--abk-bordure-clair)] bg-blanc px-5 py-4 text-[16px] text-encre"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-sm font-semibold text-encre">
                Mot de passe
              </label>
              <button
                type="button"
                className="px-2 py-1 text-sm font-semibold text-signal"
                aria-pressed={visible}
                aria-controls="password"
                onClick={() => setVisible((value) => !value)}
              >
                {visible ? "Masquer" : "Afficher"}
              </button>
            </div>
            <input
              id="password"
              name="password"
              type={visible ? "text" : "password"}
              required
              autoComplete="current-password"
              aria-invalid={state?.error ? true : undefined}
              aria-describedby={state?.error ? "login-error" : undefined}
              className="abk-bouton w-full border border-[var(--abk-bordure-clair)] bg-blanc px-5 py-4 text-[16px] text-encre"
            />
          </div>
          {state?.error ? (
            <p id="login-error" className="text-sm font-medium text-erreur" role="alert">
              {state.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="abk-bouton w-full bg-marine px-8 py-4 text-[16px] font-bold text-blanc transition-opacity disabled:opacity-60"
          >
            {pending ? "Connexion…" : "Entrer"}
          </button>
        </form>
      )}
    </div>
  );
}
