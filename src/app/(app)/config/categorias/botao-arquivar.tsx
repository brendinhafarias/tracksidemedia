"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { alternarArquivamentoCategoria } from "./acoes";

export function BotaoArquivarCategoria({ id, arquivada }: { id: string; arquivada: boolean }) {
  const [pendente, iniciarTransicao] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pendente}
      onClick={() => iniciarTransicao(() => alternarArquivamentoCategoria(id, !arquivada))}
    >
      {arquivada ? "Reativar" : "Arquivar"}
    </Button>
  );
}
