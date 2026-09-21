/**
 * Helpers para trabalhar com valores monetários como inteiros em centavos.
 * Nunca use float para dinheiro neste projeto.
 */

/** Formata um valor em centavos como moeda BRL: 123456 -> "R$ 1.234,56" */
export function formatarBRL(centavos: number): string {
  const valor = centavos / 100;
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Converte uma string digitada pelo usuário em centavos.
 * Aceita "1234", "1234,56", "1.234,56", "R$ 1.234,56", "1234.56".
 */
export function paraCentavos(texto: string): number {
  if (texto == null) return 0;
  let s = String(texto).trim();
  if (s === "") return 0;

  s = s.replace(/R\$\s?/gi, "").trim();

  const temVirgula = s.includes(",");
  const temPonto = s.includes(".");

  if (temVirgula && temPonto) {
    // 1.234,56 -> milhar com ponto, decimal com vírgula
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    // 1234,56 -> decimal com vírgula
    s = s.replace(",", ".");
  } else if (temPonto) {
    // Ambíguo: "1.234" (milhar) vs "12.50" (decimal).
    // Se houver exatamente 3 dígitos após o último ponto e mais de um grupo, trata como milhar.
    const partes = s.split(".");
    const ultima = partes[partes.length - 1];
    if (ultima.length === 3 && partes.length > 1) {
      s = s.replace(/\./g, "");
    }
    // senão mantém como decimal (ex.: "12.50")
  }

  const numero = parseFloat(s);
  if (Number.isNaN(numero)) return 0;
  return Math.round(numero * 100);
}

/** Soma uma lista de valores em centavos com segurança (inteiros). */
export function somarCentavos(valores: number[]): number {
  return valores.reduce((acc, v) => acc + Math.round(v), 0);
}

/** Calcula percentual de um valor em centavos, retornando centavos (arredondado). */
export function percentualDe(centavos: number, percentual: number): number {
  return Math.round(centavos * (percentual / 100));
}
