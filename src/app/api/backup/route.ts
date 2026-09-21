import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { obterUsuarioAtual } from "@/lib/auth/sessao";
import { formatarData } from "@/lib/data";

export async function GET() {
  const usuario = await obterUsuarioAtual();
  if (!usuario) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const caminhoBanco = path.join(process.cwd(), "prisma", "dev.db");

  try {
    const conteudo = await readFile(caminhoBanco);
    const dataArquivo = formatarData(new Date()).replaceAll("/", "-");

    return new NextResponse(new Uint8Array(conteudo), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="backup-${dataArquivo}.db"`,
      },
    });
  } catch {
    return NextResponse.json({ erro: "Não foi possível ler o arquivo do banco de dados." }, { status: 500 });
  }
}
