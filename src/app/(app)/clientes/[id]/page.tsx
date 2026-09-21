import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatarBRL } from "@/lib/dinheiro";
import { formatarData, nomeMesAbreviado, diasEntre, agora } from "@/lib/data";
import { statusExibicaoCobranca } from "@/lib/cobrancas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BotaoVoltar } from "@/components/botao-voltar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormularioCliente } from "../formulario-cliente";
import { BotaoArquivarCliente } from "../botao-arquivar";
import { IndicadorStatusCobranca } from "../../mensalidades/indicador";
import { GraficoPontualidade, type PontoPontualidade } from "./grafico-pontualidade";

export default async function PaginaFichaCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) notFound();

  const lancamentos = await prisma.lancamento.findMany({
    where: { clienteId: id },
    include: { categoria: true },
    orderBy: [{ dataCaixa: "desc" }, { criadoEm: "desc" }],
    take: 30,
  });

  const cobrancas =
    cliente.tipo === "MENSALISTA"
      ? await prisma.cobranca.findMany({
          where: { clienteId: id, status: { not: "CANCELADA" } },
          include: { lancamentos: { where: { cancelado: false, tipo: "ENTRADA", status: "EFETIVADO" } } },
          orderBy: [{ competenciaAno: "desc" }, { competenciaMes: "desc" }],
          take: 12,
        })
      : [];

  const hoje = agora();
  const pontualidade: PontoPontualidade[] = cobrancas
    .filter((c) => c.status === "PAGA")
    .map((c) => {
      const dataPagamento = c.lancamentos.reduce<Date | null>((maisRecente, l) => {
        if (!l.dataCaixa) return maisRecente;
        return !maisRecente || l.dataCaixa > maisRecente ? l.dataCaixa : maisRecente;
      }, null);
      const diasAtraso = dataPagamento ? Math.max(diasEntre(dataPagamento, c.dataVencimento), 0) : 0;
      return { rotulo: `${nomeMesAbreviado(c.competenciaMes)}/${String(c.competenciaAno).slice(2)}`, diasAtraso };
    })
    .reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BotaoVoltar href="/clientes" />
        <h1 className="text-xl font-semibold flex-1">{cliente.nome}</h1>
        <FormularioCliente
          cliente={cliente}
          trigger={<Button variant="outline" size="sm">Editar</Button>}
        />
        <BotaoArquivarCliente id={cliente.id} arquivado={cliente.arquivado} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados cadastrais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Tipo</p>
            <p>{cliente.tipo === "MENSALISTA" ? "Mensalista" : "Avulso"}</p>
          </div>
          {cliente.tipo === "MENSALISTA" && (
            <>
              <div>
                <p className="text-muted-foreground">Valor mensal</p>
                <p>{cliente.valorMensal != null ? formatarBRL(cliente.valorMensal) : "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vencimento</p>
                <p>Dia {cliente.diaVencimento}</p>
              </div>
            </>
          )}
          <div>
            <p className="text-muted-foreground">E-mail</p>
            <p>{cliente.email || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Telefone</p>
            <p>{cliente.telefone || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">CPF/CNPJ</p>
            <p>{cliente.documento || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Situação</p>
            <p>
              {cliente.arquivado ? (
                <Badge variant="outline">Inativo</Badge>
              ) : (
                <Badge variant="secondary">Ativo</Badge>
              )}
            </p>
          </div>
          {cliente.observacoes && (
            <div className="col-span-full">
              <p className="text-muted-foreground">Observações</p>
              <p>{cliente.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {cliente.tipo === "MENSALISTA" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de cobranças</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cobrancas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma cobrança gerada ainda para este cliente. Use a tela de
                Mensalidades para gerar.
              </p>
            ) : (
              <>
                {pontualidade.length > 1 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Pontualidade (dias de atraso no pagamento)</p>
                    <GraficoPontualidade dados={pontualidade} />
                  </div>
                )}
                <div className="overflow-x-auto -mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Competência</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Devido</TableHead>
                        <TableHead className="text-right">Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cobrancas.map((c) => {
                        const valorPago = c.lancamentos.reduce((soma, l) => soma + l.valor, 0);
                        return (
                          <TableRow key={c.id}>
                            <TableCell>{nomeMesAbreviado(c.competenciaMes)}/{c.competenciaAno}</TableCell>
                            <TableCell>{formatarData(c.dataVencimento)}</TableCell>
                            <TableCell>
                              <IndicadorStatusCobranca
                                status={statusExibicaoCobranca(c, hoje)}
                                tamanho="sm"
                              />
                            </TableCell>
                            <TableCell className="text-right">{formatarBRL(c.valorDevido)}</TableCell>
                            <TableCell className="text-right">{formatarBRL(valorPago)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {lancamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum lançamento vinculado a este cliente ainda.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentos.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{formatarData(l.dataCaixa)}</TableCell>
                      <TableCell>{l.descricao}</TableCell>
                      <TableCell>{l.categoria.nome}</TableCell>
                      <TableCell
                        className={`text-right ${l.tipo === "ENTRADA" ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {l.tipo === "ENTRADA" ? "+" : "-"}{formatarBRL(l.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
