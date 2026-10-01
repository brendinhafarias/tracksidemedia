"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nomeMes, nEsimoDiaUtil, proximoMes } from "@/lib/data";
import { paraInputData } from "@/lib/validacao/lancamento";
import { gerarMensalidades } from "./acoes";

const ITENS_MES: Record<string, string> = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [String(i + 1), nomeMes(i + 1)])
);

function sugerirVencimento(mesRef: number, anoRef: number): string {
  const seguinte = proximoMes(mesRef, anoRef);
  return paraInputData(nEsimoDiaUtil(5, seguinte.mes, seguinte.ano));
}

export function BotaoGerarMensalidades({
  mes,
  ano,
  variant = "default",
}: {
  mes: number;
  ano: number;
  variant?: "default" | "outline";
}) {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciarTransicao] = useTransition();
  const router = useRouter();

  const [mesRef, setMesRef] = useState(mes);
  const [anoRef, setAnoRef] = useState(ano);
  const [dataVencimento, setDataVencimento] = useState(() => sugerirVencimento(mes, ano));

  const anosDisponiveis = Array.from({ length: 3 }, (_, i) => ano - 1 + i);
  const itensAno: Record<string, string> = Object.fromEntries(anosDisponiveis.map((a) => [String(a), String(a)]));

  function alterarMesRef(valor: string) {
    const novoMes = Number(valor);
    setMesRef(novoMes);
    setDataVencimento(sugerirVencimento(novoMes, anoRef));
  }

  function alterarAnoRef(valor: string) {
    const novoAno = Number(valor);
    setAnoRef(novoAno);
    setDataVencimento(sugerirVencimento(mesRef, novoAno));
  }

  function usarQuintoDiaUtil() {
    setDataVencimento(sugerirVencimento(mesRef, anoRef));
  }

  function confirmar() {
    const [anoV, mesV, diaV] = dataVencimento.split("-").map(Number);
    if (!anoV || !mesV || !diaV) {
      toast.error("Informe uma data de vencimento válida.");
      return;
    }
    iniciarTransicao(async () => {
      const resultado = await gerarMensalidades(mesRef, anoRef, new Date(anoV, mesV - 1, diaV));
      if (resultado.criadas > 0) {
        toast.success(
          `${resultado.criadas} mensalidade(s) gerada(s) para ${nomeMes(mesRef)}/${anoRef}.`
        );
      } else {
        toast.info("Nenhuma mensalidade nova: todas já haviam sido geradas.");
      }
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <span className="contents" onClick={() => setAberto(true)}>
        <Button variant={variant} size="sm" disabled={pendente}>
          Gerar mensalidades
        </Button>
      </span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar mensalidades</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cria uma cobrança para cada cliente mensalista ativo no mês de
            referência escolhido, com a data de vencimento abaixo. Clientes que
            já têm cobrança nesse mês não são afetados.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mesRef">Mês de referência</Label>
              <Select items={ITENS_MES} value={String(mesRef)} onValueChange={(v) => v && alterarMesRef(v)}>
                <SelectTrigger id="mesRef" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ITENS_MES).map(([valor, rotulo]) => (
                    <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anoRef">Ano</Label>
              <Select items={itensAno} value={String(anoRef)} onValueChange={(v) => v && alterarAnoRef(v)}>
                <SelectTrigger id="anoRef" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {anosDisponiveis.map((a) => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="dataVencimento">Data de vencimento</Label>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={usarQuintoDiaUtil}
              >
                Usar 5º dia útil do mês seguinte
              </button>
            </div>
            <Input
              id="dataVencimento"
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
            />
          </div>

          <Button className="w-full" disabled={pendente} onClick={confirmar}>
            {pendente ? "Gerando..." : "Gerar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
