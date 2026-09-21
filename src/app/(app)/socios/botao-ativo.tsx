"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { alternarAtivoSocio } from "./acoes";

export function BotaoAtivoSocio({ id, ativo }: { id: string; ativo: boolean }) {
  const [pendente, iniciarTransicao] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pendente}
      onClick={() => iniciarTransicao(() => alternarAtivoSocio(id, !ativo))}
    >
      {ativo ? "Desativar" : "Reativar"}
    </Button>
  );
}
