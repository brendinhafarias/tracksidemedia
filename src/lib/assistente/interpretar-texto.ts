import { normalizarTexto } from "./normalizar";
import { extrairValor } from "./extrair-valor";
import { extrairData } from "./extrair-data";
import { extrairCompetencia } from "./extrair-competencia";
import { REGRAS_INTENCAO } from "./regras-intencao";
import type { IntencaoBruta } from "./tipos";

/**
 * Pipeline determinístico (normalização → classificação → extração) que
 * interpreta uma frase digitada pela usuária. Função pura: não acessa o
 * banco de dados nem resolve nomes contra cadastros reais — isso é feito
 * pela camada da aplicação, a partir do resultado aqui devolvido.
 */
export function interpretarTexto(textoOriginal: string, hoje: Date): IntencaoBruta {
  const { normalizado } = normalizarTexto(textoOriginal);

  for (const regra of REGRAS_INTENCAO) {
    const m = normalizado.match(regra.padrao);
    if (!m) continue;

    const nome = regra.extrairNome?.(m) ?? undefined;

    if (regra.acao === "CONSULTA_INADIMPLENCIA") {
      return { acao: "CONSULTA_INADIMPLENCIA" };
    }

    if (regra.acao === "CONSULTA_SITUACAO_CLIENTE") {
      if (!nome) continue;
      return { acao: "CONSULTA_SITUACAO_CLIENTE", nomeCliente: nome };
    }

    if (regra.acao === "CONSULTA_RESUMO_MES") {
      const dataBase = extrairData(normalizado, hoje) ?? hoje;
      const competencia = extrairCompetencia(normalizado, dataBase);
      return { acao: "CONSULTA_RESUMO_MES", mes: competencia.mes, ano: competencia.ano };
    }

    if (regra.acao === "CONSULTA_DIVISAO_LUCRO") {
      return { acao: "CONSULTA_DIVISAO_LUCRO" };
    }

    if (regra.acao === "REGISTRAR_PAGAMENTO") {
      const data = extrairData(normalizado, hoje) ?? hoje;
      const competencia = extrairCompetencia(normalizado, data);
      return {
        acao: "REGISTRAR_PAGAMENTO",
        nomeCliente: nome ?? null,
        valorCentavos: extrairValor(normalizado),
        data,
        competenciaMes: competencia.mes,
        competenciaAno: competencia.ano,
        textoOriginal,
      };
    }

    if (regra.acao === "REGISTRAR_DESPESA") {
      const data = extrairData(normalizado, hoje) ?? hoje;
      const competencia = extrairCompetencia(normalizado, data);
      return {
        acao: "REGISTRAR_DESPESA",
        valorCentavos: extrairValor(normalizado),
        data,
        competenciaMes: competencia.mes,
        competenciaAno: competencia.ano,
        textoOriginal,
        textoNormalizado: normalizado,
      };
    }

    if (regra.acao === "REGISTRAR_RETIRADA_SOCIO") {
      const data = extrairData(normalizado, hoje) ?? hoje;
      const competencia = extrairCompetencia(normalizado, data);
      return {
        acao: "REGISTRAR_RETIRADA_SOCIO",
        subtipo: regra.subtipoRetirada ?? "ADIANTAMENTO",
        nomeSocio: nome ?? null,
        valorCentavos: extrairValor(normalizado),
        data,
        competenciaMes: competencia.mes,
        competenciaAno: competencia.ano,
        textoOriginal,
      };
    }
  }

  return { acao: "NAO_RECONHECIDO", textoOriginal };
}
