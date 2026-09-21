/**
 * Converte números escritos por extenso em português para dígitos.
 * Opera sobre texto já em minúsculas e sem acentos (ver normalizar.ts).
 *
 * Propositalmente NÃO trata "um"/"uma" como número isolado: em português
 * essas palavras são, na imensa maioria das frases de uso real deste
 * assistente, artigos indefinidos ("um cliente", "uma cobrança"), não
 * valores. Convertê-las causaria falsos positivos na extração de valor
 * (ex.: "um cliente pagou 200" não pode virar "1 cliente pagou 200").
 */

const UNIDADES: Record<string, number> = {
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
};

const DEZ_A_DEZENOVE: Record<string, number> = {
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  catorze: 14,
  quatorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
};

const DEZENAS: Record<string, number> = {
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
};

const CENTENAS: Record<string, number> = {
  cem: 100,
  cento: 100,
  duzentos: 200,
  trezentos: 300,
  quatrocentos: 400,
  quinhentos: 500,
  seiscentos: 600,
  setecentos: 700,
  oitocentos: 800,
  novecentos: 900,
};

const DICIONARIO: Record<string, number> = {
  ...UNIDADES,
  ...DEZ_A_DEZENOVE,
  ...DEZENAS,
  ...CENTENAS,
  mil: 1000,
};

function somaGrupo(tokens: string[]): number {
  let total = 0;
  for (const tok of tokens) {
    if (tok === "e") continue;
    total += DICIONARIO[tok] ?? 0;
  }
  return total;
}

function valorDaCorrida(tokens: string[]): number {
  const idxMil = tokens.indexOf("mil");
  if (idxMil === -1) return somaGrupo(tokens);

  const antes = tokens.slice(0, idxMil).filter((t) => t !== "e");
  const depois = tokens.slice(idxMil + 1).filter((t) => t !== "e");
  const milhar = antes.length > 0 ? somaGrupo(antes) : 1;
  const resto = depois.length > 0 ? somaGrupo(depois) : 0;
  return milhar * 1000 + resto;
}

/** Substitui sequências de números por extenso (ex.: "dois mil") por dígitos ("2000"). */
export function converterNumerosPorExtenso(texto: string): string {
  const tokens = texto.split(" ");
  const resultado: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const tok = tokens[i];
    // "2 mil" / "2,5 mil": um "mil" logo após um token numérico (dígitos)
    // fica para o extrairValor resolver (ele multiplica por 1000 sozinho).
    // Só tratamos "mil" como palavra-número aqui quando ele não vem colado
    // a um número já em dígitos, para não "comer" esse padrão.
    const precedidoPorDigito = tok === "mil" && i > 0 && /\d/.test(tokens[i - 1]);

    if (tok in DICIONARIO && !precedidoPorDigito) {
      const corrida: string[] = [tok];
      let j = i + 1;
      while (j < tokens.length) {
        if (tokens[j] in DICIONARIO) {
          corrida.push(tokens[j]);
          j++;
        } else if (tokens[j] === "e" && j + 1 < tokens.length && tokens[j + 1] in DICIONARIO) {
          corrida.push(tokens[j]);
          j++;
        } else {
          break;
        }
      }
      resultado.push(String(valorDaCorrida(corrida)));
      i = j;
    } else {
      resultado.push(tok);
      i++;
    }
  }

  return resultado.join(" ");
}
