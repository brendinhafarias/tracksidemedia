"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth/exigir-usuario";
import { esquemaCliente } from "@/lib/validacao/cliente";
import { paraCentavos } from "@/lib/dinheiro";

export type EstadoFormulario = { erro?: string; sucesso?: boolean } | null;

function extrairDados(formData: FormData) {
  return esquemaCliente.safeParse({
    nome: formData.get("nome"),
    documento: formData.get("documento"),
    email: formData.get("email"),
    telefone: formData.get("telefone"),
    apelidos: formData.get("apelidos"),
    tipo: formData.get("tipo"),
    valorMensalTexto: formData.get("valorMensalTexto") || undefined,
    diaVencimento: formData.get("diaVencimento") || undefined,
    observacoes: formData.get("observacoes"),
  });
}

export async function criarCliente(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirUsuario();
  const dados = extrairDados(formData);
  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { valorMensalTexto, tipo, diaVencimento, ...resto } = dados.data;

  await prisma.cliente.create({
    data: {
      ...resto,
      documento: resto.documento || null,
      email: resto.email || null,
      telefone: resto.telefone || null,
      apelidos: resto.apelidos || null,
      observacoes: resto.observacoes || null,
      tipo,
      valorMensal: tipo === "MENSALISTA" ? paraCentavos(valorMensalTexto ?? "0") : null,
      diaVencimento: tipo === "MENSALISTA" ? diaVencimento : null,
    },
  });

  revalidatePath("/clientes");
  return { sucesso: true };
}

export async function atualizarCliente(
  id: string,
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirUsuario();
  const dados = extrairDados(formData);
  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { valorMensalTexto, tipo, diaVencimento, ...resto } = dados.data;

  await prisma.cliente.update({
    where: { id },
    data: {
      ...resto,
      documento: resto.documento || null,
      email: resto.email || null,
      telefone: resto.telefone || null,
      apelidos: resto.apelidos || null,
      observacoes: resto.observacoes || null,
      tipo,
      valorMensal: tipo === "MENSALISTA" ? paraCentavos(valorMensalTexto ?? "0") : null,
      diaVencimento: tipo === "MENSALISTA" ? diaVencimento : null,
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { sucesso: true };
}

export async function alternarArquivamentoCliente(id: string, arquivado: boolean) {
  await exigirUsuario();
  await prisma.cliente.update({
    where: { id },
    data: { arquivado, dataFim: arquivado ? new Date() : null },
  });
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
}
