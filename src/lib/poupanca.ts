import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * A poupança não é uma tabela própria: cada depósito é um lançamento de
 * saída normal (categoria "Poupança - meses sem corrida") e cada retirada é
 * um lançamento de entrada normal (categoria "Retirada da poupança") — assim
 * ela aparece no fluxo de caixa igual a qualquer outra movimentação, e o
 * saldo é sempre a diferença entre os dois, sem guardar nada duplicado.
 */
export const NOME_CATEGORIA_DEPOSITO = "Poupança - meses sem corrida";
export const NOME_CATEGORIA_RETIRADA = "Retirada da poupança";

export async function obterCategoriasPoupanca() {
  const [deposito, retirada] = await Promise.all([
    prisma.categoria.findFirst({ where: { nome: NOME_CATEGORIA_DEPOSITO, tipo: "SAIDA" } }),
    prisma.categoria.findFirst({ where: { nome: NOME_CATEGORIA_RETIRADA, tipo: "ENTRADA" } }),
  ]);
  return { deposito, retirada };
}

export async function obterOuCriarCategoriasPoupanca() {
  const { deposito, retirada } = await obterCategoriasPoupanca();
  const depositoFinal =
    deposito ??
    (await prisma.categoria.create({
      data: { nome: NOME_CATEGORIA_DEPOSITO, tipo: "SAIDA", cor: "#0ea5e9" },
    }));
  const retiradaFinal =
    retirada ??
    (await prisma.categoria.create({
      data: { nome: NOME_CATEGORIA_RETIRADA, tipo: "ENTRADA", cor: "#0ea5e9" },
    }));
  return { deposito: depositoFinal, retirada: retiradaFinal };
}

export async function obterSaldoPoupanca(): Promise<number> {
  const { deposito, retirada } = await obterCategoriasPoupanca();

  const [somaDepositos, somaRetiradas] = await Promise.all([
    deposito
      ? prisma.lancamento.aggregate({
          where: { categoriaId: deposito.id, tipo: "SAIDA", status: "EFETIVADO", cancelado: false },
          _sum: { valor: true },
        })
      : null,
    retirada
      ? prisma.lancamento.aggregate({
          where: { categoriaId: retirada.id, tipo: "ENTRADA", status: "EFETIVADO", cancelado: false },
          _sum: { valor: true },
        })
      : null,
  ]);

  return (somaDepositos?._sum.valor ?? 0) - (somaRetiradas?._sum.valor ?? 0);
}

export async function obterHistoricoPoupanca(limite = 50) {
  const { deposito, retirada } = await obterCategoriasPoupanca();
  const idsCategorias = [deposito?.id, retirada?.id].filter((id): id is string => Boolean(id));
  if (idsCategorias.length === 0) return [];

  return prisma.lancamento.findMany({
    where: { categoriaId: { in: idsCategorias }, status: "EFETIVADO", cancelado: false },
    orderBy: [{ dataCaixa: "desc" }, { criadoEm: "desc" }],
    take: limite,
  });
}
