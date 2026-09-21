import { z } from "zod";

export const esquemaSocio = z.object({
  nome: z.string().trim().min(1, "Informe o nome.").max(150),
  percentualLucroTexto: z
    .string()
    .trim()
    .min(1, "Informe o percentual de lucro."),
  proLaboreMensalTexto: z.string().trim().optional().or(z.literal("")),
});

export type DadosFormularioSocio = z.infer<typeof esquemaSocio>;
