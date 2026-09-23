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
import { formatarBRL } from "@/lib/dinheiro";
import { nomeMes } from "@/lib/data";
import { gerarLancamentoImposto } from "./acoes";

export function BotaoGerarImposto({
  mes,
  ano,
  percentual,
  entradas,
  valorImposto,
}: {
  mes: number;
  ano: number;
  percentual: number;
  entradas: number;
  valorImposto: number;
}) {
  const [pendente, iniciarTransicao] = useTransition();
  const router = useRouter();

  function confirmar() {
    iniciarTransicao(async () => {
      const resultado = await gerarLancamentoImposto(mes, ano);
      if ("erro" in resultado) {
        toast.error(resultado.erro);
      } else if (resultado.criado) {
        toast.success(`Lançamento de ${formatarBRL(resultado.valor)} gerado para ${nomeMes(mes)}/${ano}.`);
      } else {
        toast.info("O imposto deste mês já havia sido gerado.");
      }
      router.refresh();
    });
  }

  if (!percentual) {
    return (
      <p className="text-sm text-muted-foreground">
        Defina a alíquota de imposto em <strong>Dados da empresa</strong> (acima) para poder gerar o DAS previsto do mês.
      </p>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" disabled={pendente} />}>
        Gerar imposto de {nomeMes(mes)}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gerar imposto de {nomeMes(mes)}/{ano}?</AlertDialogTitle>
          <AlertDialogDescription>
            {entradas > 0 ? (
              <>
                Cria um lançamento previsto de <strong>{formatarBRL(valorImposto)}</strong> ({percentual}% sobre{" "}
                {formatarBRL(entradas)} em entradas já efetivadas neste mês). Se o mês ainda não fechou, o valor
                pode ficar menor do que o real.
              </>
            ) : (
              "Ainda não há entradas efetivadas neste mês, então o valor calculado seria zero."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmar} disabled={entradas <= 0}>Gerar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
