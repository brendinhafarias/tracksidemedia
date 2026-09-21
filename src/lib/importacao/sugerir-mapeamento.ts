import type { CampoDestino, MapeamentoColunas } from "./tipos";

const REGEX_DIACRITICOS = /[̀-ͯ]/g;

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(REGEX_DIACRITICOS, "")
    .toLowerCase()
    .trim();
}

const PALAVRAS_CHAVE: { campo: CampoDestino; padroes: RegExp }[] = [
  { campo: "valor", padroes: /valor|preco|montante|quantia|total/ },
  { campo: "data", padroes: /^data|dt\.|data.*(caixa|pagamento|movimento)/ },
  { campo: "tipo", padroes: /^tipo|entrada.*saida|natureza/ },
  { campo: "categoria", padroes: /categoria|classificacao|centro de custo/ },
  { campo: "cliente", padroes: /cliente|contato|razao social|fornecedor/ },
  { campo: "formaPagamento", padroes: /forma|pagamento|meio/ },
  { campo: "descricao", padroes: /descricao|historico|obs|observacao|discriminacao|item/ },
];

/**
 * Sugere, por similaridade de nome, para qual campo do sistema cada coluna
 * da planilha deve ser mapeada. Função pura: a pessoa sempre pode corrigir a
 * sugestão na tela antes de importar.
 */
export function sugerirMapeamento(cabecalhos: string[]): MapeamentoColunas {
  const mapeamento: MapeamentoColunas = {};

  for (const cabecalho of cabecalhos) {
    const normalizado = normalizar(cabecalho);
    const encontrado = PALAVRAS_CHAVE.find((p) => p.padroes.test(normalizado));
    mapeamento[cabecalho] = encontrado?.campo ?? "ignorar";
  }

  return mapeamento;
}
