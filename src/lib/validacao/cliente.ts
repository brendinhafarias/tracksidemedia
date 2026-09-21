import { z } from "zod";

export const TIPOS_CLIENTE = ["AVULSO", "MENSALISTA"] as const;

export const esquemaCliente = z
  .object({
    nome: z.string().trim().min(1, "Informe o nome.").max(150),
    documento: z.string().trim().max(20).optional().or(z.literal("")),
    email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
    telefone: z.string().trim().max(20).optional().or(z.literal("")),
    apelidos: z.string().trim().max(200).optional().or(z.literal("")),
    tipo: z.enum(TIPOS_CLIENTE),
    valorMensalTexto: z.string().trim().optional().or(z.literal("")),
    diaVencimento: z.coerce.number().int().min(1).max(28).optional(),
    observacoes: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine(
    (dados) => dados.tipo !== "MENSALISTA" || (dados.valorMensalTexto && dados.valorMensalTexto.length > 0),
    { message: "Informe o valor mensal para clientes mensalistas.", path: ["valorMensalTexto"] }
  )
  .refine(
    (dados) => dados.tipo !== "MENSALISTA" || (dados.diaVencimento && dados.diaVencimento >= 1 && dados.diaVencimento <= 28),
    { message: "Informe o dia de vencimento (1 a 28).", path: ["diaVencimento"] }
  );

export type DadosFormularioCliente = z.infer<typeof esquemaCliente>;
