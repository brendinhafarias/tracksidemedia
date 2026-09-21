import "server-only";
import { obterUsuarioAtual, type UsuarioSessao } from "@/lib/auth/sessao";

/** Usado no início de toda Server Action que grava dados: garante sessão válida. */
export async function exigirUsuario(): Promise<UsuarioSessao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }
  return usuario;
}
