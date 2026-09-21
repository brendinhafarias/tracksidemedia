import { extrairNomeMes } from "./meses";

function comData(base: Date, deltaDias: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + deltaDias);
  return d;
}

/**
 * Reconhece uma data relativa ou absoluta em um texto já normalizado.
 * Reconhece: "hoje", "ontem", "anteontem", "semana passada", "dia 5",
 * "5/3", "05/03/2025". Retorna null quando nada é encontrado (o chamador
 * deve então assumir "hoje").
 */
export function extrairData(textoNormalizado: string, hoje: Date): Date | null {
  if (/\banteontem\b/.test(textoNormalizado)) return comData(hoje, -2);
  if (/\bontem\b/.test(textoNormalizado)) return comData(hoje, -1);
  if (/\bhoje\b/.test(textoNormalizado)) return new Date(hoje);
  if (/\bsemana passada\b/.test(textoNormalizado)) return comData(hoje, -7);

  // dd/mm ou dd/mm/aaaa
  let m = textoNormalizado.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (m) {
    const dia = Number(m[1]);
    const mes = Number(m[2]);
    let ano = m[3] ? Number(m[3]) : hoje.getFullYear();
    if (ano < 100) ano += 2000;
    return new Date(ano, mes - 1, dia);
  }

  // "dia 5" (com nome de mês opcional na mesma frase, ex.: "dia 5 de marco")
  m = textoNormalizado.match(/\bdia (\d{1,2})\b/);
  if (m) {
    const dia = Number(m[1]);
    const mesNoTexto = extrairNomeMes(textoNormalizado);
    const mes = mesNoTexto ?? hoje.getMonth() + 1;
    const ano = hoje.getFullYear();
    return new Date(ano, mes - 1, dia);
  }

  return null;
}
