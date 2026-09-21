"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth/exigir-usuario";

export type EstadoFormulario = { erro?: string; sucesso?: boolean } | null;

async function exigirAdmin() {
  const usuario = await exigirUsuario();
  if (usuario.papel !== "ADMIN") {
    throw new Error("Apenas administradores podem gerenciar usuários.");
  }
  return usuario;
}

const esquemaCriarUsuario = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().email("E-mail inválido."),
  senha: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
  papel: z.enum(["ADMIN", "OPERADOR"]),
});

export async function criarUsuario(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirAdmin();

  const dados = esquemaCriarUsuario.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    papel: formData.get("papel"),
  });
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };

  const emailNormalizado = dados.data.email.toLowerCase().trim();
  const jaExiste = await prisma.usuario.findUnique({ where: { email: emailNormalizado } });
  if (jaExiste) return { erro: "Já existe um usuário com este e-mail." };

  const senhaHash = await bcrypt.hash(dados.data.senha, 10);
  await prisma.usuario.create({
    data: { nome: dados.data.nome, email: emailNormalizado, senhaHash, papel: dados.data.papel },
  });

  revalidatePath("/config/usuarios");
  return { sucesso: true };
}

const esquemaAtualizarUsuario = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().email("E-mail inválido."),
  papel: z.enum(["ADMIN", "OPERADOR"]),
  novaSenha: z.string().trim().optional().or(z.literal("")),
});

export async function atualizarUsuario(
  id: string,
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirAdmin();

  const dados = esquemaAtualizarUsuario.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    papel: formData.get("papel"),
    novaSenha: formData.get("novaSenha"),
  });
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };

  if (dados.data.novaSenha && dados.data.novaSenha.length > 0 && dados.data.novaSenha.length < 6) {
    return { erro: "A nova senha precisa ter ao menos 6 caracteres." };
  }

  const emailNormalizado = dados.data.email.toLowerCase().trim();
  const jaExiste = await prisma.usuario.findUnique({ where: { email: emailNormalizado } });
  if (jaExiste && jaExiste.id !== id) {
    return { erro: "Já existe um usuário com este e-mail." };
  }

  await prisma.usuario.update({
    where: { id },
    data: {
      nome: dados.data.nome,
      email: emailNormalizado,
      papel: dados.data.papel,
      ...(dados.data.novaSenha
        ? { senhaHash: await bcrypt.hash(dados.data.novaSenha, 10) }
        : {}),
    },
  });

  revalidatePath("/config/usuarios");
  return { sucesso: true };
}

export async function alternarAtivoUsuario(id: string, ativo: boolean) {
  const admin = await exigirAdmin();
  if (admin.id === id && !ativo) {
    throw new Error("Você não pode desativar seu próprio usuário.");
  }
  await prisma.usuario.update({ where: { id }, data: { ativo } });
  revalidatePath("/config/usuarios");
}
