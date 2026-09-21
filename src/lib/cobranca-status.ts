import { diasEntre } from "@/lib/data";

export type StatusExibicaoCobranca =
  | "PAGA"
  | "PARCIAL"
  | "ABERTA"
  | "ATRASADA"
  | "CANCELADA"
  | "SEM_COBRANCA";

/**
 * Deriva o status "de exibição" de uma cobrança, considerando atraso (não é
 * persistido no banco — ATRASADA é sempre calculada na hora, a partir de
 * ABERTA/PARCIAL + data de vencimento). Função pura, sem acesso a banco.
 */
export function statusExibicaoCobranca(
  cobranca: { status: string; dataVencimento: Date } | null | undefined,
  hoje: Date
): StatusExibicaoCobranca {
  if (!cobranca) return "SEM_COBRANCA";
  if (cobranca.status === "CANCELADA") return "CANCELADA";
  if (cobranca.status === "PAGA") return "PAGA";
  const atrasada = diasEntre(hoje, cobranca.dataVencimento) > 0;
  if (cobranca.status === "PARCIAL") return atrasada ? "ATRASADA" : "PARCIAL";
  return atrasada ? "ATRASADA" : "ABERTA";
}
