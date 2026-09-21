export type NomeAcao =
  | "CONSULTA_INADIMPLENCIA"
  | "CONSULTA_SITUACAO_CLIENTE"
  | "CONSULTA_RESUMO_MES"
  | "CONSULTA_DIVISAO_LUCRO"
  | "REGISTRAR_PAGAMENTO"
  | "REGISTRAR_DESPESA"
  | "REGISTRAR_RETIRADA_SOCIO";

export type RegraIntencao = {
  id: string;
  acao: NomeAcao;
  padrao: RegExp;
  /** Extrai o nome (cliente ou sócio) capturado pelo padrão, se houver. */
  extrairNome?: (m: RegExpMatchArray) => string | undefined;
  /** Só usado em REGISTRAR_RETIRADA_SOCIO: distingue pró-labore de adiantamento avulso. */
  subtipoRetirada?: "PRO_LABORE" | "ADIANTAMENTO";
};

const nomeDoGrupo1 = (m: RegExpMatchArray) => m[1]?.trim();

/**
 * Tabela ordenada de padrões → ação. A primeira regra cuja `padrao` casar
 * com o texto normalizado vence — por isso a ordem importa: consultas
 * (mais específicas, incluindo as que terminam em "?") vêm antes dos
 * lançamentos, e dentro de cada grupo os padrões mais restritos vêm antes
 * dos mais genéricos.
 */
export const REGRAS_INTENCAO: RegraIntencao[] = [
  // --- Consultas ---------------------------------------------------------
  {
    id: "inadimplencia",
    acao: "CONSULTA_INADIMPLENCIA",
    padrao: /quem falta|quem nao pagou|quem (ta|esta) devendo|inadimplen|\bem atraso\b/,
  },
  {
    id: "situacao-pergunta",
    acao: "CONSULTA_SITUACAO_CLIENTE",
    padrao: /^(.+?) pagou\?\s*$/,
    extrairNome: nomeDoGrupo1,
  },
  {
    id: "situacao-do",
    acao: "CONSULTA_SITUACAO_CLIENTE",
    padrao: /situa[c]?ao (?:do|da|de) (.+?)\s*\??$/,
    extrairNome: nomeDoGrupo1,
  },
  {
    id: "situacao-em-dia",
    acao: "CONSULTA_SITUACAO_CLIENTE",
    padrao: /^(.+?) (?:ta|esta) em dia\??\s*$/,
    extrairNome: nomeDoGrupo1,
  },
  {
    id: "resumo-mes",
    acao: "CONSULTA_RESUMO_MES",
    padrao: /quanto lucrei|resumo (?:de|do)|como (?:ta|esta)|entrou quanto/,
  },
  {
    id: "divisao-lucro",
    acao: "CONSULTA_DIVISAO_LUCRO",
    padrao: /quanto cada s[oó]ci[ao]|quanto posso tirar|divisao (?:do|de)/,
  },

  // --- Lançamentos (sempre passam por confirmação) -----------------------
  {
    id: "pagamento-me-pagou",
    acao: "REGISTRAR_PAGAMENTO",
    padrao: /^(.+?) me pagou\b/,
    extrairNome: nomeDoGrupo1,
  },
  {
    id: "pagamento-pagou",
    acao: "REGISTRAR_PAGAMENTO",
    padrao: /^(.+?) pagou\b/,
    extrairNome: nomeDoGrupo1,
  },
  {
    id: "pagamento-recebi",
    acao: "REGISTRAR_PAGAMENTO",
    padrao: /^recebi\b.*?\b(?:de|do|da)\s+([a-z][a-z\s]*?)(?:,|$)/,
    extrairNome: nomeDoGrupo1,
  },
  {
    id: "pagamento-entrou",
    acao: "REGISTRAR_PAGAMENTO",
    padrao: /^entrou\b.*?\bde\s+([a-z][a-z\s]*?)(?:,|$)/,
    extrairNome: nomeDoGrupo1,
  },

  {
    id: "despesa-paguei",
    acao: "REGISTRAR_DESPESA",
    padrao: /^paguei\b/,
  },
  {
    id: "despesa-gastei",
    acao: "REGISTRAR_DESPESA",
    padrao: /^gastei\b/,
  },
  {
    id: "despesa-saiu",
    acao: "REGISTRAR_DESPESA",
    padrao: /\bsaiu\b.*?\b(?:de|com|para)\b/,
  },

  {
    id: "retirada-tirou",
    acao: "REGISTRAR_RETIRADA_SOCIO",
    padrao: /^(.+?) tirou\b/,
    extrairNome: nomeDoGrupo1,
    subtipoRetirada: "ADIANTAMENTO",
  },
  {
    id: "retirada-pro-labore",
    acao: "REGISTRAR_RETIRADA_SOCIO",
    padrao: /pagu(?:ei|ou) pro-?labore/,
    subtipoRetirada: "PRO_LABORE",
  },
  {
    id: "retirada-retirei",
    acao: "REGISTRAR_RETIRADA_SOCIO",
    padrao: /^retirei\b/,
    subtipoRetirada: "ADIANTAMENTO",
  },
];
