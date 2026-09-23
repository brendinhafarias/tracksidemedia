"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth/exigir-usuario";

export type EstadoFormulario = { erro?: string; sucesso?: boolean } | null;

const esquemaEmpresa = z.object({
  nomeEmpresa: z.string().trim().min(1, "Informe o nome da empresa."),
  percentualReservaTexto: z.string().trim().min(1, "Informe o percentual de reserva."),
  percentualImpostoTexto: z.string().trim().min(1, "Informe a alíquota de imposto."),
  regimePadrao: z.enum(["CAIXA", "COMPETENCIA"]),
  diaFechamentoTexto: z.string().trim().min(1),
});

export async function atualizarConfigEmpresa(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirUsuario();

  const dados = esquemaEmpresa.safeParse({
    nomeEmpresa: formData.get("nomeEmpresa"),
    percentualReservaTexto: formData.get("percentualReservaTexto"),
    percentualImpostoTexto: formData.get("percentualImpostoTexto"),
    regimePadrao: formData.get("regimePadrao"),
    diaFechamentoTexto: formData.get("diaFechamentoTexto"),
  });

  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const percentualReserva = Number(dados.data.percentualReservaTexto.replace(",", "."));
  const percentualImposto = Number(dados.data.percentualImpostoTexto.replace(",", "."));
  const diaFechamento = Number(dados.data.diaFechamentoTexto);

  if (Number.isNaN(percentualReserva) || percentualReserva < 0 || percentualReserva > 100) {
    return { erro: "Percentual de reserva deve estar entre 0 e 100." };
  }
  if (Number.isNaN(percentualImposto) || percentualImposto < 0 || percentualImposto > 100) {
    return { erro: "Alíquota de imposto deve estar entre 0 e 100." };
  }
  if (!Number.isInteger(diaFechamento) || diaFechamento < 1 || diaFechamento > 28) {
    return { erro: "Dia de fechamento deve ser entre 1 e 28." };
  }

  const existente = await prisma.configEmpresa.findFirst();
  if (existente) {
    await prisma.configEmpresa.update({
      where: { id: existente.id },
      data: {
        nomeEmpresa: dados.data.nomeEmpresa,
        percentualReserva,
        percentualImposto,
        regimePadrao: dados.data.regimePadrao,
        diaFechamento,
      },
    });
  } else {
    await prisma.configEmpresa.create({
      data: {
        nomeEmpresa: dados.data.nomeEmpresa,
        percentualReserva,
        percentualImposto,
        regimePadrao: dados.data.regimePadrao,
        diaFechamento,
      },
    });
  }

  revalidatePath("/config");
  return { sucesso: true };
}
