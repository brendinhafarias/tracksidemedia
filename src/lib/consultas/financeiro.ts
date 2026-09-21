import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Regime } from "@/lib/regime";
import { diasEntre, mesAnterior } from "@/lib/data";

/** Filtro de "mês" compatível com o regime selecionado (caixa = dataCaixa, competência = mês/ano de referência). */
export function filtroPeriodo(mes: number, ano: number, regime: Regime): Prisma.LancamentoWhereInput {
  if (regime === "CAIXA") {
    return { dataCaixa: { gte: new Date(ano, mes - 1, 1), lt: new Date(ano, mes, 1) } };
  }
  return { competenciaMes: mes, competenciaAno: ano };
}

export function filtroAno(ano: number, regime: Regime): Prisma.LancamentoWhereInput {
  if (regime === "CAIXA") {
    return { dataCaixa: { gte: new Date(ano, 0, 1), lt: new Date(ano + 1, 0, 1) } };
  }
  return { competenciaAno: ano };
}

export type Totais = { entradas: number; saidas: number; lucro: number };

async function somarPorTipo(where: Prisma.LancamentoWhereInput): Promise<Totais> {
  const base: Prisma.LancamentoWhereInput = { ...where, status: "EFETIVADO", cancelado: false };
  const [entradas, saidas] = await Promise.all([
    prisma.lancamento.aggregate({ where: { ...base, tipo: "ENTRADA" }, _sum: { valor: true } }),
    prisma.lancamento.aggregate({ where: { ...base, tipo: "SAIDA" }, _sum: { valor: true } }),
  ]);
  const totalEntradas = entradas._sum.valor ?? 0;
  const totalSaidas = saidas._sum.valor ?? 0;
  return { entradas: totalEntradas, saidas: totalSaidas, lucro: totalEntradas - totalSaidas };
}

export async function totaisPeriodo(mes: number, ano: number, regime: Regime): Promise<Totais> {
  return somarPorTipo(filtroPeriodo(mes, ano, regime));
}

export async function totaisAno(ano: number, regime: Regime): Promise<Totais> {
  return somarPorTipo(filtroAno(ano, regime));
}

/** Variação percentual de `atual` em relação a `anterior`. null quando não há base de comparação. */
export function variacaoPercentual(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual === 0 ? 0 : null;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

export async function serieMensal(
  meses: { mes: number; ano: number }[],
  regime: Regime
): Promise<(Totais & { mes: number; ano: number })[]> {
  return Promise.all(
    meses.map(async ({ mes, ano }) => {
      const totais = await totaisPeriodo(mes, ano, regime);
      return { mes, ano, ...totais };
    })
  );
}

export type PendenciasMes = { aReceber: number; emAtraso: number };

/** Total pendente (ABERTA+PARCIAL) e total já atrasado das cobranças cuja competência é o mês informado. */
export async function pendenciasDoMes(mes: number, ano: number, hoje: Date): Promise<PendenciasMes> {
  const cobrancas = await prisma.cobranca.findMany({
    where: {
      competenciaMes: mes,
      competenciaAno: ano,
      status: { in: ["ABERTA", "PARCIAL"] },
    },
    include: {
      lancamentos: { where: { tipo: "ENTRADA", status: "EFETIVADO", cancelado: false } },
    },
  });

  let aReceber = 0;
  let emAtraso = 0;

  for (const c of cobrancas) {
    const pago = c.lancamentos.reduce((soma, l) => soma + l.valor, 0);
    const restante = c.valorDevido - pago;
    if (restante <= 0) continue;
    aReceber += restante;
    if (diasEntre(hoje, c.dataVencimento) > 0) emAtraso += restante;
  }

  return { aReceber, emAtraso };
}

export type AtrasoCliente = {
  cobrancaId: string;
  clienteId: string;
  clienteNome: string;
  competenciaMes: number;
  competenciaAno: number;
  valorRestante: number;
  diasAtraso: number;
};

export async function maioresAtrasos(hoje: Date, limite = 5): Promise<AtrasoCliente[]> {
  const cobrancas = await prisma.cobranca.findMany({
    where: { status: { in: ["ABERTA", "PARCIAL"] }, dataVencimento: { lt: hoje } },
    include: {
      cliente: true,
      lancamentos: { where: { tipo: "ENTRADA", status: "EFETIVADO", cancelado: false } },
    },
  });

  const atrasos = cobrancas
    .map((c) => {
      const pago = c.lancamentos.reduce((soma, l) => soma + l.valor, 0);
      const valorRestante = c.valorDevido - pago;
      return {
        cobrancaId: c.id,
        clienteId: c.clienteId,
        clienteNome: c.cliente.nome,
        competenciaMes: c.competenciaMes,
        competenciaAno: c.competenciaAno,
        valorRestante,
        diasAtraso: diasEntre(hoje, c.dataVencimento),
      };
    })
    .filter((a) => a.valorRestante > 0)
    .sort((a, b) => b.valorRestante - a.valorRestante);

  return atrasos.slice(0, limite);
}

export type DespesaCategoria = { categoriaId: string; nome: string; cor: string; total: number };

export async function despesasPorCategoria(where: Prisma.LancamentoWhereInput): Promise<DespesaCategoria[]> {
  const grupos = await prisma.lancamento.groupBy({
    by: ["categoriaId"],
    where: { ...where, tipo: "SAIDA", status: "EFETIVADO", cancelado: false },
    _sum: { valor: true },
  });

  const categorias = await prisma.categoria.findMany({
    where: { id: { in: grupos.map((g) => g.categoriaId) } },
  });
  const categoriaPorId = new Map(categorias.map((c) => [c.id, c]));

  return grupos
    .map((g) => {
      const categoria = categoriaPorId.get(g.categoriaId);
      return {
        categoriaId: g.categoriaId,
        nome: categoria?.nome ?? "Sem categoria",
        cor: categoria?.cor ?? "#94a3b8",
        total: g._sum.valor ?? 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export type ReceitaCliente = { clienteId: string; nome: string; total: number };

export async function receitaPorCliente(where: Prisma.LancamentoWhereInput): Promise<ReceitaCliente[]> {
  const grupos = await prisma.lancamento.groupBy({
    by: ["clienteId"],
    where: { ...where, tipo: "ENTRADA", status: "EFETIVADO", cancelado: false, clienteId: { not: null } },
    _sum: { valor: true },
  });

  const clientes = await prisma.cliente.findMany({
    where: { id: { in: grupos.map((g) => g.clienteId as string) } },
  });
  const clientePorId = new Map(clientes.map((c) => [c.id, c]));

  return grupos
    .map((g) => ({
      clienteId: g.clienteId as string,
      nome: clientePorId.get(g.clienteId as string)?.nome ?? "Cliente removido",
      total: g._sum.valor ?? 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export type PontoInadimplencia = { mes: number; ano: number; totalEmAtraso: number; qtd: number };

export async function evolucaoInadimplencia(
  meses: { mes: number; ano: number }[],
  hoje: Date
): Promise<PontoInadimplencia[]> {
  return Promise.all(
    meses.map(async ({ mes, ano }) => {
      const { emAtraso } = await pendenciasDoMes(mes, ano, hoje);
      const qtd = await prisma.cobranca.count({
        where: {
          competenciaMes: mes,
          competenciaAno: ano,
          status: { in: ["ABERTA", "PARCIAL"] },
          dataVencimento: { lt: hoje },
        },
      });
      return { mes, ano, totalEmAtraso: emAtraso, qtd };
    })
  );
}

export { mesAnterior };
