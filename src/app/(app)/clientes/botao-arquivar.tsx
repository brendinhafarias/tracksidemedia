"use client";

import { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { alternarArquivamentoCliente } from "./acoes";

export function BotaoArquivarCliente({ id, arquivado }: { id: string; arquivado: boolean }) {
  const [pendente, iniciarTransicao] = useTransition();

  if (arquivado) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={pendente}
        onClick={() => iniciarTransicao(() => alternarArquivamentoCliente(id, false))}
      >
        Reativar
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-destructive" />}>
        Inativar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Inativar cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            O cliente deixa de aparecer nas listas ativas e nas gerações de
            mensalidade, mas o histórico é mantido. Você pode reativá-lo
            depois.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => iniciarTransicao(() => alternarArquivamentoCliente(id, true))}
          >
            Inativar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
