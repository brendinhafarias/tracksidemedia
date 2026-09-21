import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const NOME_COOKIE = "sessao_token";
const DURACAO_SESSAO_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias

export type UsuarioSessao = {
  id: string;
  nome: string;
  email: string;
  papel: "ADMIN" | "OPERADOR";
};

export async function criarSessao(usuarioId: string) {
  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + DURACAO_SESSAO_MS);

  await prisma.sessao.create({
    data: { token, usuarioId, expiraEm },
  });

  const store = await cookies();
  store.set(NOME_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEm,
  });
}

export async function encerrarSessao() {
  const store = await cookies();
  const token = store.get(NOME_COOKIE)?.value;
  if (token) {
    await prisma.sessao.deleteMany({ where: { token } }).catch(() => {});
  }
  store.delete(NOME_COOKIE);
}

export async function obterUsuarioAtual(): Promise<UsuarioSessao | null> {
  const store = await cookies();
  const token = store.get(NOME_COOKIE)?.value;
  if (!token) return null;

  const sessao = await prisma.sessao.findUnique({
    where: { token },
    include: { usuario: true },
  });

  if (!sessao || sessao.expiraEm < new Date() || !sessao.usuario.ativo) {
    return null;
  }

  return {
    id: sessao.usuario.id,
    nome: sessao.usuario.nome,
    email: sessao.usuario.email,
    papel: sessao.usuario.papel,
  };
}
