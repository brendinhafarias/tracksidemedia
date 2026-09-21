"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatarBRL } from "@/lib/dinheiro";
import { formatarData, nomeMes, agora } from "@/lib/data";
import { RUS_FORMA_PAGAMENTO, FORMAS_PAGAMENTO, paraInputData } from "@/lib/validacao/lancamento";
import { IndicadorStatusCobranca } from "./indicador";
import type { StatusExibicaoCobranca } from "@/lib/cobrancas";
import { marcarComoPagaHoje, registrarPagamentoCobranca, type EstadoRegistroPagamento } from "./acoes";

export type DetalheCobranca = {
  cobrancaId: string;
  clienteNome: string;
  mes: number;
  ano: number;
  valorDevido: number;
  valorPago: number;
  dataVencimento: Date;
  statusExibicao: StatusExibicaoCobranca;
  lancamentos: { id: string; valor: number; dataCaixa: Date | null; formaPagamento: string }[];
};

export function PainelCobranca({
  detalhe,
  aoFechar,
}: {
  detalhe: DetalheCobranca | null;
  aoFechar: () => void;
}) {
  return (
    <Sheet open={detalhe != null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <SheetContent side="bottom" className="sm:max-w-md sm:mx-auto sm:rounded-t-lg max-h-[85vh] overflow-y-auto">
        {detalhe && <ConteudoPainel detalhe={detalhe} />}
      </SheetContent>
    </Sheet>
  );
}

function ConteudoPainel({ detalhe }: { detalhe: DetalheCobranca }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pendente, iniciarTransicao] = useTransition();
  const restante = detalhe.valorDevido - detalhe.valorPago;

  const acaoRegistrar = registrarPagamentoCobranca.bind(null, detalhe.cobrancaId);
  const [estado, formAction, salvando] = useActionState<EstadoRegistroPagamento, FormData>(
    acaoRegistrar,
    null
  );

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {detalhe.clienteNome} · {nomeMes(detalhe.mes)}/{detalhe.ano}
        </SheetTitle>
      </SheetHeader>

      <div className="px-4 pb-4 space-y-4">
        <div className="flex items-center gap-3">
          <IndicadorStatusCobranca status={detalhe.statusExibicao} />
          <div className="text-sm">
            <p className="text-muted-foreground">Vencimento {formatarData(detalhe.dataVencimento)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Devido</p>
            <p className="font-medium">{formatarBRL(detalhe.valorDevido)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pago</p>
            <p className="font-medium">{formatarBRL(detalhe.valorPago)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Restante</p>
            <p className="font-medium">{formatarBRL(Math.max(restante, 0))}</p>
          </div>
        </div>

        {restante > 0 && !mostrarFormulario && (
          <div className="flex flex-col gap-2">
            <Button
              disabled={pendente}
              onClick={() =>
                iniciarTransicao(() => marcarComoPagaHoje(detalhe.cobrancaId))
              }
            >
              Marcar como paga hoje ({formatarBRL(restante)})
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMostrarFormulario(true)}>
              Registrar outro valor / data
            </Button>
          </div>
        )}

        {restante > 0 && mostrarFormulario && (
          <form action={formAction} className="space-y-3 rounded-md border p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="valorTexto">Valor (R$)</Label>
                <Input
                  id="valorTexto"
                  name="valorTexto"
                  defaultValue={(restante / 100).toFixed(2).replace(".", ",")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="data">Data</Label>
                <Input id="data" name="data" type="date" defaultValue={paraInputData(agora())} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="formaPagamento">Forma de pagamento</Label>
              <Select
                items={Object.fromEntries(FORMAS_PAGAMENTO.map((f) => [f, RUS_FORMA_PAGAMENTO[f]]))}
                name="formaPagamento"
                defaultValue="PIX"
              >
                <SelectTrigger id="formaPagamento" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((f) => (
                    <SelectItem key={f} value={f}>{RUS_FORMA_PAGAMENTO[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={salvando} className="flex-1">
                {salvando ? "Salvando..." : "Registrar pagamento"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMostrarFormulario(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Pagamentos recebidos</p>
          {detalhe.lancamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
          ) : (
            <ul className="space-y-1">
              {detalhe.lancamentos.map((l) => (
                <li key={l.id} className="flex items-center justify-between text-sm">
                  <span>{formatarData(l.dataCaixa)}</span>
                  <Badge variant="outline">{RUS_FORMA_PAGAMENTO[l.formaPagamento as keyof typeof RUS_FORMA_PAGAMENTO] ?? l.formaPagamento}</Badge>
                  <span className="font-medium">{formatarBRL(l.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
