"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth/exigir-usuario";
import { esquemaCategoria } from "@/lib/validacao/categoria";

export type EstadoFormulario = { erro?: string; sucesso?: boolean } | null;

export async function criarCategoria(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirUsuario();

  const dados = esquemaCategoria.safeParse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    cor: formData.get("cor") || "#64748b",
  });

  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.categoria.create({ data: dados.data });
  revalidatePath("/config/categorias");
  return { sucesso: true };
}

export async function atualizarCategoria(
  id: string,
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirUsuario();

  const dados = esquemaCategoria.safeParse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    cor: formData.get("cor") || "#64748b",
  });

  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.categoria.update({ where: { id }, data: dados.data });
  revalidatePath("/config/categorias");
  return { sucesso: true };
}

export async function alternarArquivamentoCategoria(id: string, arquivada: boolean) {
  await exigirUsuario();
  await prisma.categoria.update({ where: { id }, data: { arquivada } });
  revalidatePath("/config/categorias");
}
