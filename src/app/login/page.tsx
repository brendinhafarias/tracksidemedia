import { redirect } from "next/navigation";
import { Flag } from "lucide-react";
import { obterUsuarioAtual } from "@/lib/auth/sessao";
import { AlternadorTema } from "@/components/alternador-tema";
import { FormularioLogin } from "./formulario-login";

export default async function PaginaLogin() {
  const usuario = await obterUsuarioAtual();
  if (usuario) redirect("/");

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_-10%,color-mix(in_oklch,var(--primary),transparent_75%),transparent_55%),radial-gradient(circle_at_100%_10%,color-mix(in_oklch,var(--brand-teal),transparent_80%),transparent_55%)]"
      />
      <div className="absolute right-4 top-4">
        <AlternadorTema />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),var(--brand-teal))] text-primary-foreground shadow-lg shadow-primary/25">
            <Flag className="size-7" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-heading font-semibold uppercase tracking-wide">
              Trackside <span className="text-primary">Media</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Entre com seu e-mail e senha para continuar.
            </p>
          </div>
        </div>
        <FormularioLogin />
      </div>
    </div>
  );
}
