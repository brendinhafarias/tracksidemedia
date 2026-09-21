import "server-only";
import { prisma } from "@/lib/prisma";

export type { StatusExibicaoCobranca } from "@/lib/cobranca-status";
export { statusExibicaoCobranca } from "@/lib/cobranca-status";

/** Recalcula o status de uma cobrança a partir da soma dos lançamentos vinculados a ela. */
export async function recalcularStatusCobranca(cobrancaId: string): Promise<void> {
  const cobranca = await prisma.cobranca.findUnique({ where: { id: cobrancaId } });
  if (!cobranca || cobranca.status === "CANCELADA") return;

  const soma = await prisma.lancamento.aggregate({
    where: {
      cobrancaId,
      tipo: "ENTRADA",
      status: "EFETIVADO",
      cancelado: false,
    },
    _sum: { valor: true },
  });

  const valorPago = soma._sum.valor ?? 0;
  const novoStatus = valorPago <= 0 ? "ABERTA" : valorPago >= cobranca.valorDevido ? "PAGA" : "PARCIAL";

  if (novoStatus !== cobranca.status) {
    await prisma.cobranca.update({ where: { id: cobrancaId }, data: { status: novoStatus } });
  }
}
