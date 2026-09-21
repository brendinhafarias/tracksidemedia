/** Nomes de mês sem acento (texto já normalizado), na ordem 1-12. */
export const NOMES_MES_SEM_ACENTO = [
  "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Procura um nome de mês por extenso no texto (já normalizado) e devolve 1-12, ou null. */
export function extrairNomeMes(textoNormalizado: string): number | null {
  for (let i = 0; i < NOMES_MES_SEM_ACENTO.length; i++) {
    const regex = new RegExp(`\\b${NOMES_MES_SEM_ACENTO[i]}\\b`);
    if (regex.test(textoNormalizado)) return i + 1;
  }
  return null;
}
