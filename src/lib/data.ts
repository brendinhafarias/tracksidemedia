import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const FUSO_HORARIO = "America/Sao_Paulo";

const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Retorna a data/hora atual no fuso America/Sao_Paulo. */
export function agora(): Date {
  const agoraUtc = new Date();
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO_HORARIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(agoraUtc);

  const obter = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "0";
  return new Date(
    Number(obter("year")),
    Number(obter("month")) - 1,
    Number(obter("day")),
    Number(obter("hour")),
    Number(obter("minute")),
    Number(obter("second"))
  );
}

/** Formata uma data como dd/MM/yyyy. */
export function formatarData(data: Date | string | null | undefined): string {
  if (!data) return "-";
  const d = typeof data === "string" ? parseISO(data) : data;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

/** Formata uma data com hora: dd/MM/yyyy HH:mm */
export function formatarDataHora(data: Date | string | null | undefined): string {
  if (!data) return "-";
  const d = typeof data === "string" ? parseISO(data) : data;
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function nomeMes(mes: number): string {
  return NOMES_MESES[mes - 1] ?? "";
}

export function nomeMesAbreviado(mes: number): string {
  return nomeMes(mes).slice(0, 3);
}

/** Retorna {mes, ano} do mês anterior ao informado. */
export function mesAnterior(mes: number, ano: number): { mes: number; ano: number } {
  if (mes === 1) return { mes: 12, ano: ano - 1 };
  return { mes: mes - 1, ano };
}

/** Retorna {mes, ano} do mês seguinte ao informado. */
export function proximoMes(mes: number, ano: number): { mes: number; ano: number } {
  if (mes === 12) return { mes: 1, ano: ano + 1 };
  return { mes: mes + 1, ano };
}

/** Gera os últimos N meses (incluindo o atual) como [{mes, ano}], do mais antigo ao mais recente. */
export function ultimosMeses(qtd: number, referencia?: { mes: number; ano: number }): { mes: number; ano: number }[] {
  const ref = referencia ?? { mes: agora().getMonth() + 1, ano: agora().getFullYear() };
  const resultado: { mes: number; ano: number }[] = [];
  let atual = ref;
  for (let i = 0; i < qtd; i++) {
    resultado.unshift(atual);
    atual = mesAnterior(atual.mes, atual.ano);
  }
  return resultado;
}

export function diasEntre(a: Date, b: Date): number {
  const umDia = 1000 * 60 * 60 * 24;
  const dataA = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const dataB = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((dataA.getTime() - dataB.getTime()) / umDia);
}
