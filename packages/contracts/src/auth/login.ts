import { z } from "zod";

export const sessionCookie = "aa_session";

export const productLink = z
  .string()
  .trim()
  .url("Colle un lien complet, avec https://.");

export const loginInput = z.object({
  email: z.string().trim().email("Indique un e-mail valide."),
  password: z.string().min(1, "Indique le mot de passe."),
});

export type LoginInput = z.infer<typeof loginInput>;
