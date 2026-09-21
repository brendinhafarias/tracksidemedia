import { paraCentavos } from "@/lib/dinheiro";

/**
 * Reconhece um valor monetário em um texto já normalizado (minúsculo, sem
 * acentos, números por extenso já convertidos em dígitos) e devolve o valor
 * em centavos. Retorna null quando nenhum valor é encontrado.
 *
 * Formatos reconhecidos: "2000", "2.000", "2000,50", "r$ 2.000,00",
 * "2 mil", "2,5 mil", "2k".
 */
export function extrairValor(textoNormalizado: string): number | null {
  const semPrefixo = textoNormalizado.replace(/r\$\s*/g, "");

  let m = semPrefixo.match(/(\d+(?:[.,]\d+)?)\s*mil\b/);
  if (m) return Math.round(parseFloat(m[1].replace(",", ".")) * 1000 * 100);

  m = semPrefixo.match(/(\d+(?:[.,]\d+)?)\s*k\b/);
  if (m) return Math.round(parseFloat(m[1].replace(",", ".")) * 1000 * 100);

  // milhar com ponto e centavos: 2.000,00 / 1.234,56
  m = semPrefixo.match(/\d{1,3}(?:\.\d{3})+,\d{2}/);
  if (m) return paraCentavos(m[0]);

  // milhar com ponto, sem centavos: 2.000 / 1.234
  m = semPrefixo.match(/\d{1,3}(?:\.\d{3})+(?!\d)/);
  if (m) return paraCentavos(m[0]);

  // decimal com vírgula, sem separador de milhar: 2000,50 / 340,00
  m = semPrefixo.match(/\d+,\d{1,2}\b/);
  if (m) return paraCentavos(m[0]);

  // inteiro simples: 2000 / 340
  m = semPrefixo.match(/\d+/);
  if (m) return paraCentavos(m[0]);

  return null;
}
