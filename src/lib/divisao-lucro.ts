import { percentualDe } from "@/lib/dinheiro";

export type SocioParaDivisao = { id: string; percentualLucro: number };

export type ResultadoDivisaoLucro = {
  valorReserva: number;
  valorDistribuivel: number;
  cotas: { socioId: string; valor: number }[];
};

/**
 * Calcula a divisão de lucro do mês: reserva da empresa, valor distribuível
 * e a cota de cada sócio ativo. Retorna tudo zerado quando não há lucro
 * (a interface é responsável por explicar isso ao usuário).
 */
export function calcularDivisaoLucro(
  lucro: number,
  percentualReserva: number,
  socios: SocioParaDivisao[]
): ResultadoDivisaoLucro {
  if (lucro <= 0) {
    return { valorReserva: 0, valorDistribuivel: 0, cotas: socios.map((s) => ({ socioId: s.id, valor: 0 })) };
  }

  const valorReserva = percentualDe(lucro, percentualReserva);
  const valorDistribuivel = lucro - valorReserva;

  const cotas = socios.map((s) => ({
    socioId: s.id,
    valor: percentualDe(valorDistribuivel, s.percentualLucro),
  }));

  return { valorReserva, valorDistribuivel, cotas };
}
