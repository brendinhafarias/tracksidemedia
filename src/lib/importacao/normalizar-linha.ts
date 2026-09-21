import { paraCentavos } from "@/lib/dinheiro";
import { excelSerialParaData, pareceSerialDeData } from "./excel-data";
import type { LinhaProcessada, MapeamentoColunas } from "./tipos";

const REGEX_DIACRITICOS = /[̀-ͯ]/g;

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(REGEX_DIACRITICOS, "").toLowerCase().trim();
}

function paraTexto(valor: unknown): string {
  if (valor == null) return "";
  return String(valor).trim();
}

/** true quando a linha claramente é um cabeçalho repetido ou uma linha de total, e deve ser pulada sem erro. */
function ehLinhaIgnoravel(valoresBrutos: Record<string, unknown>, cabecalhosOriginais: string[]): string | null {
  const valores = Object.values(valoresBrutos).map((v) => normalizar(paraTexto(v)));
  const textoDaLinha = valores.join(" ");

  if (/^total\b|\btotal geral\b|\bsubtotal\b/.test(textoDaLinha)) {
    return "Linha de total ignorada.";
  }

  const cabecalhosNormalizados = cabecalhosOriginais.map(normalizar);
  const pareceCabecalho = valores.some((v) => v.length > 0 && cabecalhosNormalizados.includes(v));
  if (pareceCabecalho) {
    return "Linha de cabeçalho repetida ignorada.";
  }

  const todasVazias = valores.every((v) => v.length === 0);
  if (todasVazias) {
    return "Linha vazia ignorada.";
  }

  return null;
}

function extrairValor(bruto: unknown): { valorCentavos: number | null; negativo: boolean } {
  if (typeof bruto === "number") {
    return { valorCentavos: Math.round(Math.abs(bruto) * 100), negativo: bruto < 0 };
  }
  const texto = paraTexto(bruto);
  if (!texto) return { valorCentavos: null, negativo: false };
  const negativo = /^-|\(.*\)$/.test(texto.trim());
  const centavos = paraCentavos(texto.replace(/[()-]/g, ""));
  return { valorCentavos: centavos > 0 ? centavos : null, negativo };
}

function extrairData(bruto: unknown): Date | null {
  if (typeof bruto === "number" && pareceSerialDeData(bruto)) {
    return excelSerialParaData(bruto);
  }
  const texto = paraTexto(bruto);
  if (!texto) return null;

  const iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const br = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (br) {
    let ano = Number(br[3]);
    if (ano < 100) ano += 2000;
    return new Date(ano, Number(br[2]) - 1, Number(br[1]));
  }

  return null;
}

function extrairTipo(bruto: unknown): "ENTRADA" | "SAIDA" | null {
  const texto = normalizar(paraTexto(bruto));
  if (!texto) return null;
  if (/entrada|receita|recebiment/.test(texto)) return "ENTRADA";
  if (/saida|despesa|pagamento/.test(texto)) return "SAIDA";
  return null;
}

function extrairFormaPagamento(bruto: unknown): string | undefined {
  const texto = normalizar(paraTexto(bruto));
  if (!texto) return undefined;
  if (texto.includes("pix")) return "PIX";
  if (texto.includes("dinheiro") || texto.includes("especie")) return "DINHEIRO";
  if (texto.includes("cartao")) return "CARTAO";
  if (texto.includes("boleto")) return "BOLETO";
  if (texto.includes("transferencia") || texto.includes("ted") || texto.includes("doc")) return "TRANSFERENCIA";
  return "OUTRO";
}

/**
 * Converte uma linha bruta da planilha (valores como o SheetJS devolve —
 * podem ser string, number ou null/undefined por causa de células
 * mescladas) em campos do sistema, usando o mapeamento de colunas
 * escolhido. Função pura: não toca banco de dados — a existência de
 * categoria/cliente é resolvida depois, pela camada da aplicação.
 */
export function normalizarLinha(
  numeroDaLinha: number,
  valoresBrutos: Record<string, unknown>,
  mapeamento: MapeamentoColunas,
  cabecalhosOriginais: string[]
): LinhaProcessada {
  const motivoIgnorada = ehLinhaIgnoravel(valoresBrutos, cabecalhosOriginais);
  if (motivoIgnorada) {
    return { linha: numeroDaLinha, ignorada: true, motivoIgnorada, erros: [], avisos: [] };
  }

  const erros: string[] = [];
  const avisos: string[] = [];
  const resultado: LinhaProcessada = { linha: numeroDaLinha, ignorada: false, erros, avisos };

  const colunaPara = (campo: string) =>
    Object.entries(mapeamento).find(([, destino]) => destino === campo)?.[0];

  const colValor = colunaPara("valor");
  const colData = colunaPara("data");
  const colDescricao = colunaPara("descricao");
  const colTipo = colunaPara("tipo");
  const colCategoria = colunaPara("categoria");
  const colCliente = colunaPara("cliente");
  const colForma = colunaPara("formaPagamento");

  if (!colValor) {
    erros.push("Nenhuma coluna mapeada para 'valor'.");
  } else {
    const { valorCentavos, negativo } = extrairValor(valoresBrutos[colValor]);
    if (valorCentavos == null) {
      erros.push("Valor ausente ou não numérico.");
    } else {
      resultado.valorCentavos = valorCentavos;
      if (!colTipo) {
        resultado.tipo = negativo ? "SAIDA" : "ENTRADA";
      }
    }
  }

  if (colTipo) {
    const tipo = extrairTipo(valoresBrutos[colTipo]);
    if (!tipo) {
      erros.push("Tipo não reconhecido (use algo como 'entrada'/'saída').");
    } else {
      resultado.tipo = tipo;
    }
  }

  if (!colData) {
    avisos.push("Nenhuma coluna mapeada para 'data' — o lançamento será gravado como previsto (sem data de caixa).");
  } else {
    const data = extrairData(valoresBrutos[colData]);
    if (!data) {
      erros.push("Data inválida.");
    } else {
      resultado.dataCaixa = data;
    }
  }

  if (!colDescricao) {
    erros.push("Nenhuma coluna mapeada para 'descrição'.");
  } else {
    const descricao = paraTexto(valoresBrutos[colDescricao]);
    if (!descricao) {
      erros.push("Descrição vazia.");
    } else {
      resultado.descricao = descricao;
    }
  }

  if (colCategoria) {
    const categoria = paraTexto(valoresBrutos[colCategoria]);
    if (categoria) resultado.categoriaNome = categoria;
  }

  if (colCliente) {
    const cliente = paraTexto(valoresBrutos[colCliente]);
    if (cliente) resultado.clienteNome = cliente;
  }

  if (colForma) {
    resultado.formaPagamento = extrairFormaPagamento(valoresBrutos[colForma]) ?? "OUTRO";
  }

  return resultado;
}
