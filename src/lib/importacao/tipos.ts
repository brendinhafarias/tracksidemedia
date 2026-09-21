export const CAMPOS_DESTINO = [
  "tipo",
  "valor",
  "descricao",
  "data",
  "categoria",
  "cliente",
  "formaPagamento",
  "ignorar",
] as const;

export type CampoDestino = (typeof CAMPOS_DESTINO)[number];

/** Chave = nome original da coluna na planilha; valor = campo do sistema. */
export type MapeamentoColunas = Record<string, CampoDestino>;

export type LinhaProcessada = {
  linha: number;
  ignorada: boolean;
  motivoIgnorada?: string;
  erros: string[];
  avisos: string[];
  tipo?: "ENTRADA" | "SAIDA";
  valorCentavos?: number;
  descricao?: string;
  dataCaixa?: Date;
  categoriaNome?: string;
  clienteNome?: string;
  formaPagamento?: string;
};
