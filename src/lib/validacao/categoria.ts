import { z } from "zod";

export const TIPOS_CATEGORIA = ["ENTRADA", "SAIDA"] as const;

export const esquemaCategoria = z.object({
  nome: z.string().trim().min(1, "Informe o nome.").max(80),
  tipo: z.enum(TIPOS_CATEGORIA),
  cor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida.")
    .default("#64748b"),
});

export type DadosFormularioCategoria = z.infer<typeof esquemaCategoria>;
