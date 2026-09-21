import { Flag, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sair } from "@/lib/auth/acoes";
import type { UsuarioSessao } from "@/lib/auth/sessao";
import { AlternadorTema } from "@/components/alternador-tema";

export function BarraSuperior({ usuario }: { usuario: UsuarioSessao }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-3 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--brand-teal))] text-primary-foreground shadow-sm">
            <Flag className="size-4" />
          </span>
          <span className="font-heading text-lg font-semibold uppercase tracking-wide">
            Trackside <span className="text-primary">Media</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {usuario.nome}
          </span>
          <AlternadorTema />
          <form action={sair}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
