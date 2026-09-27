"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginInput, sessionCookie } from "@aa/contracts";
import { authConfigured, sealSession, verifyLogin } from "@aa/core";

export type LoginState = { error?: string } | undefined;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!authConfigured()) return { error: "Les accès ne sont pas configurés." };

  const parsed = loginInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Vérifie les champs." };
  }
  if (!verifyLogin(parsed.data.email, parsed.data.password)) {
    return { error: "E-mail ou mot de passe incorrect." };
  }

  const jar = await cookies();
  jar.set(sessionCookie, sealSession(parsed.data.email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect("/");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(sessionCookie);
  redirect("/connexion");
}
