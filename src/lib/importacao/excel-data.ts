/**
 * Converte um número de série de data do Excel (dias desde 30/12/1899) em
 * uma Date local. Planilhas exportadas às vezes trazem datas assim quando a
 * célula não está formatada como data.
 */
export function excelSerialParaData(serial: number): Date {
  const EPOCA_EXCEL_UTC = Date.UTC(1899, 11, 30);
  const milissegundos = EPOCA_EXCEL_UTC + Math.round(serial) * 86400000;
  const utc = new Date(milissegundos);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

/** Reconhece um número de série plausível de data do Excel (evita confundir com valores monetários). */
export function pareceSerialDeData(valor: number): boolean {
  // Datas entre ~1990 e ~2035, aproximadamente.
  return valor > 32874 && valor < 49000 && Number.isInteger(valor);
}
