"use client";

import { useEffect, useState } from "react";
import { ChevronsLeft, ChevronsRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chat } from "@/app/(app)/assistente/chat";
import { cn } from "@/lib/utils";

type Categoria = { id: string; nome: string; tipo: "ENTRADA" | "SAIDA" };
type Cliente = { id: string; nome: string };
type Socio = { id: string; nome: string };

const CHAVE_RECOLHIDO = "assistente-recolhido";

export function AssistenteColuna({
  categorias,
  clientes,
  socios,
}: {
  categorias: Categoria[];
  clientes: Cliente[];
  socios: Socio[];
}) {
  const [recolhido, setRecolhido] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura de preferência salva no primeiro mount; não há valor de props/estado anterior para comparar.
      setRecolhido(localStorage.getItem(CHAVE_RECOLHIDO) === "1");
    } catch {
      // localStorage indisponível (ex: navegação privada) — mantém expandido
    }
  }, []);

  function alternar() {
    setRecolhido((atual) => {
      const novo = !atual;
      try {
        localStorage.setItem(CHAVE_RECOLHIDO, novo ? "1" : "0");
      } catch {
        // localStorage indisponível — apenas o estado em memória muda
      }
      return novo;
    });
  }

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-l border-border/70 bg-background sm:flex",
        recolhido ? "sm:w-12" : "sm:w-96"
      )}
    >
      {recolhido ? (
        <div className="flex flex-col items-center gap-3 pt-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={alternar}
            aria-label="Expandir assistente"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Sparkles className="size-4 text-primary" />
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="font-heading text-sm font-semibold uppercase tracking-wide">
                Assistente
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={alternar}
              aria-label="Recolher assistente"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
          <div className="min-h-0 flex-1">
            <Chat categorias={categorias} clientes={clientes} socios={socios} />
          </div>
        </div>
      )}
    </aside>
  );
}
