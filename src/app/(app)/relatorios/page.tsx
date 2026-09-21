import { obterRegime } from "@/lib/regime";
import { agora, nomeMes, nomeMesAbreviado, ultimosMeses } from "@/lib/data";
import { formatarBRL } from "@/lib/dinheiro";
import { GraficoTendencia } from "@/components/dashboard/grafico-tendencia";
import { ExportarDados } from "@/components/exportar-dados";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  serieMensal,
  despesasPorCategoria,
  receitaPorCliente,
  evolucaoInadimplencia,
  filtroPeriodo,
  filtroAno,
} from "@/lib/consultas/financeiro";
import { SeletorPeriodo } from "./seletor-periodo";
import { GraficoRosca } from "./grafico-rosca";
import { BarrasHorizontais } from "./barras-horizontais";

export default async function PaginaRelatorios({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const regime = await obterRegime();
  const hoje = agora();

  const ano = params.ano ? Number(params.ano) : hoje.getFullYear();
  const anoInteiro = params.mes === "todos";
  const mes = !anoInteiro && params.mes ? Number(params.mes) : hoje.getMonth() + 1;

  const rotuloPeriodo = anoInteiro ? `${ano}` : `${nomeMes(mes)}/${ano}`;
  const whereEntradas = anoInteiro ? filtroAno(ano, regime) : filtroPeriodo(mes, ano, regime);

  const meses12 = ultimosMeses(12, { mes: hoje.getMonth() + 1, ano: hoje.getFullYear() });

  const [serie, despesas, receitas, inadimplencia] = await Promise.all([
    serieMensal(meses12, regime),
    despesasPorCategoria(whereEntradas),
    receitaPorCliente(whereEntradas),
    evolucaoInadimplencia(meses12, hoje),
  ]);

  const dadosComparativo = serie.map((s) => ({
    rotulo: `${nomeMesAbreviado(s.mes)}/${String(s.ano).slice(2)}`,
    entradas: s.entradas,
    saidas: s.saidas,
    lucro: s.lucro,
  }));

  const totalDespesas = despesas.reduce((soma, d) => soma + d.total, 0);
  const totalReceitas = receitas.reduce((soma, r) => soma + r.total, 0);

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - 3 + i);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <SeletorPeriodo mes={mes} ano={ano} anoInteiro={anoInteiro} anosDisponiveis={anosDisponiveis} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Comparativo mês a mês (últimos 12 meses)</CardTitle>
          <ExportarDados
            nomeArquivo="comparativo-mensal"
            dados={serie.map((s) => ({
              Mês: `${nomeMes(s.mes)}/${s.ano}`,
              Entradas: s.entradas / 100,
              Saídas: s.saidas / 100,
              Lucro: s.lucro / 100,
            }))}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <GraficoTendencia dados={dadosComparativo} />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Saídas</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serie.map((s) => (
                  <TableRow key={`${s.ano}-${s.mes}`}>
                    <TableCell>{nomeMes(s.mes)}/{s.ano}</TableCell>
                    <TableCell className="text-right text-emerald-600">{formatarBRL(s.entradas)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatarBRL(s.saidas)}</TableCell>
                    <TableCell className={`text-right font-medium ${s.lucro < 0 ? "text-red-600" : ""}`}>
                      {formatarBRL(s.lucro)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Despesas por categoria · {rotuloPeriodo}</CardTitle>
          <ExportarDados
            nomeArquivo="despesas-por-categoria"
            dados={despesas.map((d) => ({ Categoria: d.nome, Total: d.total / 100 }))}
          />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <GraficoRosca dados={despesas.map((d) => ({ nome: d.nome, total: d.total, cor: d.cor }))} />
          <div className="space-y-2">
            {despesas.map((d) => (
              <div key={d.categoriaId} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: d.cor }} />
                  {d.nome}
                </span>
                <span className="font-medium">
                  {formatarBRL(d.total)}{" "}
                  <span className="text-muted-foreground">
                    ({totalDespesas > 0 ? Math.round((d.total / totalDespesas) * 100) : 0}%)
                  </span>
                </span>
              </div>
            ))}
            {despesas.length > 0 && (
              <div className="flex items-center justify-between text-sm font-semibold border-t pt-2">
                <span>Total</span>
                <span>{formatarBRL(totalDespesas)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Receita por cliente · {rotuloPeriodo}</CardTitle>
          <ExportarDados
            nomeArquivo="receita-por-cliente"
            dados={receitas.map((r) => ({ Cliente: r.nome, Total: r.total / 100 }))}
          />
        </CardHeader>
        <CardContent>
          <BarrasHorizontais dados={receitas.map((r) => ({ rotulo: r.nome, total: r.total }))} />
          {receitas.length > 0 && (
            <div className="flex items-center justify-between text-sm font-semibold border-t pt-2 mt-3">
              <span>Total</span>
              <span>{formatarBRL(totalReceitas)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Evolução da inadimplência (últimos 12 meses)</CardTitle>
          <ExportarDados
            nomeArquivo="evolucao-inadimplencia"
            dados={inadimplencia.map((i) => ({
              Mês: `${nomeMes(i.mes)}/${i.ano}`,
              "Total em atraso": i.totalEmAtraso / 100,
              "Qtd. cobranças": i.qtd,
            }))}
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Total em atraso</TableHead>
                  <TableHead className="text-right">Qtd. cobranças</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inadimplencia.map((i) => (
                  <TableRow key={`${i.ano}-${i.mes}`}>
                    <TableCell>{nomeMes(i.mes)}/{i.ano}</TableCell>
                    <TableCell className={`text-right ${i.totalEmAtraso > 0 ? "text-red-600 font-medium" : ""}`}>
                      {formatarBRL(i.totalEmAtraso)}
                    </TableCell>
                    <TableCell className="text-right">{i.qtd}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
