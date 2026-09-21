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
import { gerarMensalidades } from "./acoes";

export function BotaoGerarMensalidades({
  mes,
  ano,
  variant = "default",
}: {
  mes: number;
  ano: number;
  variant?: "default" | "outline";
}) {
  const [pendente, iniciarTransicao] = useTransition();
  const router = useRouter();

  function confirmar() {
    iniciarTransicao(async () => {
      const resultado = await gerarMensalidades(mes, ano);
      if (resultado.criadas > 0) {
        toast.success(
          `${resultado.criadas} mensalidade(s) gerada(s) para ${nomeMes(mes)}/${ano}.`
        );
      } else {
        toast.info("Nenhuma mensalidade nova: todas já haviam sido geradas.");
      }
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant={variant} size="sm" disabled={pendente} />}>
        Gerar mensalidades de {nomeMes(mes)}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gerar mensalidades de {nomeMes(mes)}/{ano}?</AlertDialogTitle>
          <AlertDialogDescription>
            Será criada uma cobrança para cada cliente mensalista ativo neste
            mês, usando o valor e o dia de vencimento cadastrados. Clientes que
            já têm cobrança neste mês não são afetados.
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
