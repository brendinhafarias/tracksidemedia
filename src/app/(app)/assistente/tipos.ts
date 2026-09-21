export type CamposConfirmacao = {
  tipo: "ENTRADA" | "SAIDA";
  /** 0 = ainda não preenchido (fallback); sempre >0 para poder confirmar. */
  valorCentavos: number;
  descricao: string;
  /** yyyy-MM-dd */
  dataCaixa: string;
  competenciaMes: number;
  competenciaAno: number;
  categoriaId: string;
  categoriaNome: string;
  clienteId: string | null;
  clienteNome: string | null;
  socioId: string | null;
  socioNome: string | null;
  cobrancaId: string | null;
  cobrancaInfo: string | null;
  /** Contexto interno para reconstruir a ação após uma escolha de cliente/sócio. */
  acaoOrigem: "PAGAMENTO" | "DESPESA" | "RETIRADA_SOCIO";
  subtipoRetirada?: "PRO_LABORE" | "ADIANTAMENTO";
};

export type CandidatoNome = { id: string; nome: string };

export type RespostaAssistente =
  | { tipo: "resposta"; texto: string }
  | { tipo: "confirmacao"; campos: CamposConfirmacao }
  // "escolha"/"sem_correspondencia" sempre no fluxo de lançamento (grava depois de confirmar)
  | { tipo: "escolha"; entidade: "cliente" | "socio"; candidatos: CandidatoNome[]; campos: CamposConfirmacao }
  | { tipo: "sem_correspondencia"; entidade: "cliente" | "socio"; nomeDigitado: string; campos: CamposConfirmacao }
  // ambiguidade dentro de uma consulta (não grava nada, só responde)
  | { tipo: "escolha_consulta"; candidatos: CandidatoNome[] }
  | { tipo: "fallback"; motivo: string; campos: CamposConfirmacao };

export type TurnoConversa = {
  id: string;
  prompt: string;
  resposta: RespostaAssistente;
  resolvido?: { lancamentoId: string; resumo: string; desfeito?: boolean };
};
