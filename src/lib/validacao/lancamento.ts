import { z } from "zod";

export const TIPOS_LANCAMENTO = ["ENTRADA", "SAIDA"] as const;
export const FORMAS_PAGAMENTO = [
  "PIX",
  "TRANSFERENCIA",
  "DINHEIRO",
  "CARTAO",
  "BOLETO",
  "OUTRO",
] as const;
export const STATUS_LANCAMENTO = ["PREVISTO", "EFETIVADO", "CANCELADO"] as const;

export const RUS_FORMA_PAGAMENTO: Record<(typeof FORMAS_PAGAMENTO)[number], string> = {
  PIX: "Pix",
  TRANSFERENCIA: "Transferência",
  DINHEIRO: "Dinheiro",
  CARTAO: "Cartão",
  BOLETO: "Boleto",
  OUTRO: "Outro",
};

export const RUS_STATUS_LANCAMENTO: Record<(typeof STATUS_LANCAMENTO)[number], string> = {
  PREVISTO: "Previsto",
  EFETIVADO: "Efetivado",
  CANCELADO: "Cancelado",
};

// yyyy-MM-dd (de <input type="date">) ou string vazia
const dataOpcional = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
  .nullable()
  .or(z.literal(""))
  .optional();

export const esquemaLancamento = z.object({
  tipo: z.enum(TIPOS_LANCAMENTO, { message: "Selecione o tipo." }),
  valorTexto: z.string().trim().min(1, "Informe o valor."),
  descricao: z.string().trim().min(1, "Informe uma descrição.").max(200),
  dataCaixa: dataOpcional,
  competenciaMes: z.coerce.number().int().min(1).max(12),
  competenciaAno: z.coerce.number().int().min(2000).max(2100),
  categoriaId: z.string().min(1, "Selecione uma categoria."),
  clienteId: z.string().nullable().optional().or(z.literal("")),
  formaPagamento: z.enum(FORMAS_PAGAMENTO),
});

export type DadosFormularioLancamento = z.infer<typeof esquemaLancamento>;

/** Converte "yyyy-MM-dd" em Date local (evita bug de fuso horário do `new Date(string)`). */
export function paraDataLocal(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const [ano, mes, dia] = valor.split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  return new Date(ano, mes - 1, dia);
}

/** Formata uma Date para o valor esperado por <input type="date">. */
export function paraInputData(data: Date | null | undefined): string {
  if (!data) return "";
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
