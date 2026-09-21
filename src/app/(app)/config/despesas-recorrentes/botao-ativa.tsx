"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { alternarAtivaDespesaRecorrente } from "./acoes";

export function BotaoAtivaDespesa({ id, ativa }: { id: string; ativa: boolean }) {
  const [pendente, iniciarTransicao] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pendente}
      onClick={() => iniciarTransicao(() => alternarAtivaDespesaRecorrente(id, !ativa))}
    >
      {ativa ? "Desativar" : "Reativar"}
    </Button>
  );
}
