"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { alternarAtivoUsuario } from "./acoes";

export function BotaoAtivoUsuario({ id, ativo }: { id: string; ativo: boolean }) {
  const [pendente, iniciarTransicao] = useTransition();

  function alternar() {
    iniciarTransicao(async () => {
      try {
        await alternarAtivoUsuario(id, !ativo);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
      }
    });
  }

  return (
    <Button variant="ghost" size="sm" disabled={pendente} onClick={alternar}>
      {ativo ? "Desativar" : "Reativar"}
    </Button>
  );
}
