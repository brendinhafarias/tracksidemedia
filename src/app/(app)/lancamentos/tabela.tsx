"use client";

import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatarBRL } from "@/lib/dinheiro";
import { formatarData, nomeMesAbreviado } from "@/lib/data";
import { RUS_FORMA_PAGAMENTO, RUS_STATUS_LANCAMENTO } from "@/lib/validacao/lancamento";
import { CelulaEditavel } from "./celula-editavel";
import { FormularioLancamento } from "./formulario-lancamento";
import {
  atualizarDescricaoLancamento,
  atualizarValorLancamento,
  cancelarLancamento,
} from "./acoes";

type Categoria = { id: string; nome: string; tipo: "ENTRADA" | "SAIDA"; cor: string };
type Cliente = { id: string; nome: string };

export type LinhaLancamento = {
  id: string;
  tipo: "ENTRADA" | "SAIDA";
  valor: number;
  descricao: string;
  dataCaixa: Date | null;
  competenciaMes: number;
  competenciaAno: number;
  categoriaId: string;
  categoria: { nome: string; cor: string };
  clienteId: string | null;
  cliente: { nome: string } | null;
  formaPagamento: keyof typeof RUS_FORMA_PAGAMENTO;
  status: keyof typeof RUS_STATUS_LANCAMENTO;
};

function variantStatus(status: LinhaLancamento["status"]) {
  if (status === "EFETIVADO") return "secondary" as const;
  if (status === "CANCELADO") return "outline" as const;
  return "outline" as const;
}

export function TabelaLancamentos({
  lancamentos,
  categorias,
  clientes,
}: {
  lancamentos: LinhaLancamento[];
  categorias: Categoria[];
  clientes: Cliente[];
}) {
  const [, iniciarTransicao] = useTransition();

  if (lancamentos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nenhum lançamento encontrado com os filtros atuais.
      </p>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Competência</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lancamentos.map((l) => (
            <TableRow key={l.id} className={l.status === "CANCELADO" ? "opacity-50" : undefined}>
              <TableCell className="whitespace-nowrap">
                {l.dataCaixa ? formatarData(l.dataCaixa) : "-"}
              </TableCell>
              <TableCell className="min-w-40">
                <CelulaEditavel
                  valorInicial={l.descricao}
                  formatarExibicao={(v) => v}
                  onSalvar={(v) => atualizarDescricaoLancamento(l.id, v)}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge
                  variant="outline"
                  style={{ borderColor: l.categoria.cor, color: l.categoria.cor }}
                >
                  {l.categoria.nome}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">{l.cliente?.nome ?? "-"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {nomeMesAbreviado(l.competenciaMes)}/{l.competenciaAno}
              </TableCell>
              <TableCell
                className={`text-right whitespace-nowrap ${l.tipo === "ENTRADA" ? "text-emerald-600" : "text-red-600"}`}
              >
                <CelulaEditavel
                  valorInicial={(l.valor / 100).toFixed(2).replace(".", ",")}
                  inputMode="decimal"
                  formatarExibicao={() => `${l.tipo === "ENTRADA" ? "+" : "-"}${formatarBRL(l.valor)}`}
                  onSalvar={(v) => atualizarValorLancamento(l.id, v)}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge variant={variantStatus(l.status)}>{RUS_STATUS_LANCAMENTO[l.status]}</Badge>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap space-x-1">
                <FormularioLancamento
                  categorias={categorias}
                  clientes={clientes}
                  lancamento={l}
                  trigger={<Button variant="outline" size="sm">Editar</Button>}
                />
                {l.status !== "CANCELADO" && (
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-destructive" />}>
                      Cancelar
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar este lançamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O lançamento não será excluído do banco, apenas
                          marcado como cancelado e removido dos totais.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => iniciarTransicao(() => cancelarLancamento(l.id))}
                        >
                          Cancelar lançamento
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
