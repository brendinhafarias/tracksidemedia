import Link from "next/link";
import { TrendingUp, TrendingDown, Wallet, Clock, AlertTriangle, PiggyBank } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obterRegime } from "@/lib/regime";
import { agora, formatarData, nomeMes, nomeMesAbreviado, ultimosMeses, mesAnterior } from "@/lib/data";
import { formatarBRL } from "@/lib/dinheiro";
import { obterSaldoPoupanca } from "@/lib/poupanca";
import { SeletorMes } from "@/components/seletor-mes";
import { CartaoMetrica } from "@/components/dashboard/cartao-metrica";
import { GraficoTendencia } from "@/components/dashboard/grafico-tendencia";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  totaisPeriodo,
  variacaoPercentual,
  serieMensal,
  pendenciasDoMes,
  maioresAtrasos,
} from "@/lib/consultas/financeiro";

export default async function PaginaDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const regime = await obterRegime();
  const hoje = agora();

  let mes = hoje.getMonth() + 1;
  let ano = hoje.getFullYear();
  if (params.mes) {
    const [anoStr, mesStr] = params.mes.split("-");
    if (anoStr && mesStr) {
      ano = Number(anoStr);
      mes = Number(mesStr);
    }
  }

  const anterior = mesAnterior(mes, ano);

  const [totaisAtual, totaisAnterior, pendencias, atrasos, ultimosLancamentos, saldoPoupanca] = await Promise.all([
    totaisPeriodo(mes, ano, regime),
    totaisPeriodo(anterior.mes, anterior.ano, regime),
    pendenciasDoMes(mes, ano, hoje),
    maioresAtrasos(hoje, 5),
    prisma.lancamento.findMany({
      where: { cancelado: false },
      include: { categoria: true, cliente: true },
      orderBy: { criadoEm: "desc" },
      take: 10,
    }),
    obterSaldoPoupanca(),
  ]);

  const meses12 = ultimosMeses(12, { mes: hoje.getMonth() + 1, ano: hoje.getFullYear() });
  const serie = await serieMensal(meses12, regime);
  const dadosGrafico = serie.map((s) => ({
    rotulo: `${nomeMesAbreviado(s.mes)}/${String(s.ano).slice(2)}`,
    entradas: s.entradas,
    saidas: s.saidas,
    lucro: s.lucro,
  }));

  const opcoesMeses = ultimosMeses(24, { mes: hoje.getMonth() + 1, ano: hoje.getFullYear() }).reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <SeletorMes mes={mes} ano={ano} opcoes={opcoesMeses} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <CartaoMetrica
          titulo="Entradas"
          valor={totaisAtual.entradas}
          variacao={variacaoPercentual(totaisAtual.entradas, totaisAnterior.entradas)}
          icone={TrendingUp}
          tom="emerald"
        />
        <CartaoMetrica
          titulo="Saídas"
          valor={totaisAtual.saidas}
          variacao={variacaoPercentual(totaisAtual.saidas, totaisAnterior.saidas)}
          invertervariacao
          icone={TrendingDown}
          tom="red"
        />
        <CartaoMetrica
          titulo="Lucro"
          valor={totaisAtual.lucro}
          variacao={variacaoPercentual(totaisAtual.lucro, totaisAnterior.lucro)}
          corValor={totaisAtual.lucro < 0 ? "text-red-600" : undefined}
          icone={Wallet}
          tom="primary"
        />
        <CartaoMetrica titulo="A receber" valor={pendencias.aReceber} icone={Clock} tom="amber" />
        <CartaoMetrica
          titulo="Em atraso"
          valor={pendencias.emAtraso}
          corValor={pendencias.emAtraso > 0 ? "text-red-600" : undefined}
          icone={AlertTriangle}
          tom="red"
        />
        <Link href="/poupanca">
          <CartaoMetrica titulo="Poupança" valor={saldoPoupanca} icone={PiggyBank} tom="primary" />
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos 12 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <GraficoTendencia dados={dadosGrafico} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maiores atrasos</CardTitle>
          </CardHeader>
          <CardContent>
            {atrasos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma cobrança em atraso. 🎉</p>
            ) : (
              <ul className="space-y-2">
                {atrasos.map((a) => (
                  <li key={a.cobrancaId} className="flex items-center justify-between text-sm">
                    <div>
                      <Link href={`/clientes/${a.clienteId}`} className="font-medium hover:underline">
                        {a.clienteNome}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {nomeMes(a.competenciaMes)}/{a.competenciaAno} · {a.diasAtraso} dia(s) de atraso
                      </p>
                    </div>
                    <span className="font-medium text-red-600">{formatarBRL(a.valorRestante)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos lançamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {ultimosLancamentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lançamento registrado ainda.</p>
            ) : (
              <ul className="space-y-2">
                {ultimosLancamentos.map((l) => (
                  <li key={l.id} className="flex items-center justify-between text-sm gap-2">
                    <div className="min-w-0">
                      <p className="truncate">{l.descricao}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatarData(l.dataCaixa)} · {l.categoria.nome}
                        {l.cliente ? ` · ${l.cliente.nome}` : ""}
                        {l.status === "PREVISTO" && (
                          <Badge variant="outline" className="ml-1 align-middle">Previsto</Badge>
                        )}
                      </p>
                    </div>
                    <span
                      className={`font-medium whitespace-nowrap ${l.tipo === "ENTRADA" ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {l.tipo === "ENTRADA" ? "+" : "-"}{formatarBRL(l.valor)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
