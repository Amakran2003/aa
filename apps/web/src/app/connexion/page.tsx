import type { Metadata } from "next";
import { authConfigured } from "@aa/core";
import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md">
          <LoginForm configured={authConfigured()} />
        </div>
      </div>
    </AppShell>
  );
}
