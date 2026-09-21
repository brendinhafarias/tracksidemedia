"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatarBRL } from "@/lib/dinheiro";
import { registrarRetiradaLucro } from "./acoes";

export function BotaoRegistrarRetirada({
  socioId,
  mes,
  ano,
  valor,
}: {
  socioId: string;
  mes: number;
  ano: number;
  valor: number;
}) {
  const [pendente, iniciarTransicao] = useTransition();
  const router = useRouter();

  function confirmar() {
    iniciarTransicao(async () => {
      const resultado = await registrarRetiradaLucro(socioId, mes, ano, valor);
      if (resultado.erro) {
        toast.error(resultado.erro);
      } else {
        toast.success("Retirada registrada.");
      }
      router.refresh();
    });
  }

  return (
    <Button size="sm" disabled={pendente || valor <= 0} onClick={confirmar}>
      Registrar retirada ({formatarBRL(valor)})
    </Button>
  );
}
