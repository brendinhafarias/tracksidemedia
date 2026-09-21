"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { nomeMes } from "@/lib/data";
import { gerarLancamentosDespesasRecorrentes } from "./acoes";

export function BotaoGerarDespesas({ mes, ano }: { mes: number; ano: number }) {
  const [pendente, iniciarTransicao] = useTransition();
  const router = useRouter();

  function confirmar() {
    iniciarTransicao(async () => {
      const resultado = await gerarLancamentosDespesasRecorrentes(mes, ano);
      if (resultado.criadas > 0) {
        toast.success(`${resultado.criadas} lançamento(s) previsto(s) gerado(s) para ${nomeMes(mes)}/${ano}.`);
      } else {
        toast.info("Nenhum lançamento novo: todos já haviam sido gerados.");
      }
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" disabled={pendente} />}>
        Gerar lançamentos de {nomeMes(mes)}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gerar lançamentos de {nomeMes(mes)}/{ano}?</AlertDialogTitle>
          <AlertDialogDescription>
            Cria um lançamento previsto (sem data de caixa) para cada despesa
            recorrente ativa neste mês. Despesas que já têm lançamento neste
            mês não são duplicadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmar}>Gerar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
