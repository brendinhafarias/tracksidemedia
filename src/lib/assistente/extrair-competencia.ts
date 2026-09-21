import { mesAnterior } from "@/lib/data";
import { extrairNomeMes } from "./meses";

export type Competencia = { mes: number; ano: number };

/**
 * Reconhece a competência (mês a que um valor se refere) em um texto já
 * normalizado. Reconhece "mes passado", "mes retrasado", "referente a X",
 * "de X" (X = nome de mês). Quando nada é encontrado, usa o mês da
 * `dataCaixa` informada — comportamento padrão do sistema.
 */
export function extrairCompetencia(textoNormalizado: string, dataCaixa: Date): Competencia {
  const mesDaData = dataCaixa.getMonth() + 1;
  const anoDaData = dataCaixa.getFullYear();

  if (/\bmes retrasado\b/.test(textoNormalizado)) {
    const umAtras = mesAnterior(mesDaData, anoDaData);
    return mesAnterior(umAtras.mes, umAtras.ano);
  }
  if (/\bmes passado\b/.test(textoNormalizado)) {
    return mesAnterior(mesDaData, anoDaData);
  }

  const mesNomeado = extrairNomeMes(textoNormalizado);
  if (mesNomeado) {
    // Se o mês citado ainda não aconteceu neste ano, assume o ano anterior
    // (a pessoa dificilmente está falando de um mês futuro).
    const ano = mesNomeado > mesDaData ? anoDaData - 1 : anoDaData;
    return { mes: mesNomeado, ano };
  }

  return { mes: mesDaData, ano: anoDaData };
}
