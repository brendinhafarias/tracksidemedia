"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatarBRL } from "@/lib/dinheiro";
import { nomeMesAbreviado } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { IndicadorStatusCobranca, legendaStatus } from "./indicador";
import { PainelCobranca, type DetalheCobranca } from "./painel-cobranca";
import type { StatusExibicaoCobranca } from "@/lib/cobrancas";

export type CelulaMes = {
  mes: number;
  statusExibicao: StatusExibicaoCobranca;
  detalhe: DetalheCobranca | null;
  valorPago: number;
};

export type LinhaClienteMensalidade = {
  clienteId: string;
  clienteNome: string;
  celulas: CelulaMes[];
  totalAno: number;
  devendo: boolean;
};

export function GradeMensalidades({ linhas }: { linhas: LinhaClienteMensalidade[] }) {
  const [somenteDevendo, setSomenteDevendo] = useState(false);
  const [selecao, setSelecao] = useState<{ clienteId: string; mes: number } | null>(null);

  // Deriva o detalhe a partir das `linhas` atuais (em vez de guardar uma cópia
  // no estado) para que o painel reflita automaticamente os dados mais
  // recentes depois que uma ação de pagamento revalida a página.
  const detalheSelecionado = useMemo(() => {
    if (!selecao) return null;
    const linha = linhas.find((l) => l.clienteId === selecao.clienteId);
    const celula = linha?.celulas.find((c) => c.mes === selecao.mes);
    return celula?.detalhe ?? null;
  }, [linhas, selecao]);

  const linhasVisiveis = useMemo(
    () => (somenteDevendo ? linhas.filter((l) => l.devendo) : linhas),
    [linhas, somenteDevendo]
  );

  const totaisPorMes = useMemo(() => {
    const totais = Array.from({ length: 12 }, () => 0);
    for (const linha of linhas) {
      linha.celulas.forEach((celula, i) => {
        totais[i] += celula.valorPago;
      });
    }
    return totais;
  }, [linhas]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Checkbox
            id="somente-devendo"
            checked={somenteDevendo}
            onCheckedChange={(v) => setSomenteDevendo(v === true)}
          />
          <Label htmlFor="somente-devendo" className="text-sm font-normal">
            Mostrar só quem está devendo
          </Label>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {legendaStatus().map(({ status, simbolo, rotulo }) => (
            <span key={status} className="flex items-center gap-1">
              <span className="inline-block w-4 text-center">{simbolo}</span>
              {rotulo}
            </span>
          ))}
        </div>
      </div>

      {linhasVisiveis.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {somenteDevendo
            ? "Ninguém está devendo no momento."
            : "Nenhum cliente mensalista cadastrado ainda."}
        </p>
      ) : (
        <>
          {/* Desktop: grade cliente x mês */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-2 font-medium sticky left-0 bg-muted/40">Cliente</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} className="p-2 font-medium text-center w-12">
                      {nomeMesAbreviado(i + 1)}
                    </th>
                  ))}
                  <th className="p-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {linhasVisiveis.map((linha) => (
                  <tr key={linha.clienteId} className="border-b last:border-0">
                    <td className="p-2 sticky left-0 bg-background">
                      <Link href={`/clientes/${linha.clienteId}`} className="hover:underline font-medium">
                        {linha.clienteNome}
                      </Link>
                    </td>
                    {linha.celulas.map((celula) => (
                      <td key={celula.mes} className="p-1 text-center">
                        <button
                          type="button"
                          disabled={!celula.detalhe}
                          onClick={() => celula.detalhe && setSelecao({ clienteId: linha.clienteId, mes: celula.mes })}
                          className={cn(!celula.detalhe && "cursor-default")}
                        >
                          <IndicadorStatusCobranca status={celula.statusExibicao} tamanho="sm" />
                        </button>
                      </td>
                    ))}
                    <td className="p-2 text-right font-medium whitespace-nowrap">
                      {formatarBRL(linha.totalAno)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/40">
                  <td className="p-2 font-medium sticky left-0 bg-muted/40">Total do mês</td>
                  {totaisPorMes.map((total, i) => (
                    <td key={i} className="p-1 text-center text-xs font-medium">
                      {total > 0 ? formatarBRL(total).replace("R$", "").trim() : "-"}
                    </td>
                  ))}
                  <td className="p-2 text-right font-semibold whitespace-nowrap">
                    {formatarBRL(totaisPorMes.reduce((a, b) => a + b, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile: lista por cliente com meses em chips roláveis */}
          <div className="md:hidden space-y-3">
            {linhasVisiveis.map((linha) => (
              <div key={linha.clienteId} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Link href={`/clientes/${linha.clienteId}`} className="font-medium hover:underline">
                    {linha.clienteNome}
                  </Link>
                  <span className="text-sm text-muted-foreground">{formatarBRL(linha.totalAno)}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {linha.celulas.map((celula) => (
                    <button
                      key={celula.mes}
                      type="button"
                      disabled={!celula.detalhe}
                      onClick={() => celula.detalhe && setSelecao({ clienteId: linha.clienteId, mes: celula.mes })}
                      className="flex flex-col items-center gap-1 shrink-0"
                    >
                      <span className="text-[10px] text-muted-foreground">
                        {nomeMesAbreviado(celula.mes)}
                      </span>
                      <IndicadorStatusCobranca status={celula.statusExibicao} tamanho="sm" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <PainelCobranca detalhe={detalheSelecionado} aoFechar={() => setSelecao(null)} />
    </div>
  );
}
