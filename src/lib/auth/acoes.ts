"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { criarSessao, encerrarSessao } from "@/lib/auth/sessao";

const esquemaLogin = z.object({
  email: z.string().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

export type EstadoLogin = { erro?: string } | null;

export async function entrar(_estado: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const dados = esquemaLogin.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: dados.data.email.toLowerCase().trim() },
  });

  if (!usuario || !usuario.ativo) {
    return { erro: "E-mail ou senha incorretos." };
  }

  const senhaOk = await bcrypt.compare(dados.data.senha, usuario.senhaHash);
  if (!senhaOk) {
    return { erro: "E-mail ou senha incorretos." };
  }

  await criarSessao(usuario.id);
  redirect("/");
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}
