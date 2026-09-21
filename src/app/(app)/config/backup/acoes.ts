"use server";

import path from "path";
import { writeFile } from "fs/promises";
import { exigirUsuario } from "@/lib/auth/exigir-usuario";

export type ResultadoRestauracao = { erro?: string; caminhoArquivo?: string };

/**
 * Não substitui o banco em uso diretamente: o processo do sistema mantém o
 * arquivo `prisma/dev.db` aberto, e sobrescrevê-lo "ao vivo" arrisca corromper
 * o banco. Em vez disso, grava o arquivo enviado como `dev.restaurado.db` ao
 * lado do banco atual — a pessoa conclui a troca com o sistema desligado,
 * exatamente como o backup manual descrito no README.
 */
export async function enviarArquivoRestauracao(formData: FormData): Promise<ResultadoRestauracao> {
  await exigirUsuario();

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File)) {
    return { erro: "Selecione um arquivo de backup (.db)." };
  }

  const bytes = new Uint8Array(await arquivo.arrayBuffer());

  const assinatura = new TextDecoder().decode(bytes.slice(0, 16));
  if (!assinatura.startsWith("SQLite format 3")) {
    return { erro: "Este arquivo não parece ser um backup válido do sistema (esperado um arquivo .db do SQLite)." };
  }

  const destino = path.join(process.cwd(), "prisma", "dev.restaurado.db");
  await writeFile(destino, bytes);

  return { caminhoArquivo: "prisma/dev.restaurado.db" };
}
