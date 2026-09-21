import { converterNumerosPorExtenso } from "./numeros-por-extenso";

export type TextoNormalizado = {
  /** Texto exatamente como o usuário digitou, para exibição. */
  original: string;
  /** Minúsculo, sem acentos, espaçamento normalizado e números por extenso convertidos em dígitos. Usado internamente para casar padrões. */
  normalizado: string;
};

const REGEX_DIACRITICOS = /[̀-ͯ]/g;

function removerAcentos(texto: string): string {
  return texto.normalize("NFD").replace(REGEX_DIACRITICOS, "");
}

export function normalizarTexto(textoOriginal: string): TextoNormalizado {
  const semAcentos = removerAcentos(textoOriginal.toLowerCase());
  const espacamentoOk = semAcentos.replace(/\s+/g, " ").trim();
  const comNumeros = converterNumerosPorExtenso(espacamentoOk);

  return { original: textoOriginal, normalizado: comNumeros };
}
