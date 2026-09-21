/**
 * Cria (ou atualiza) um usuário administrador — pensado para o primeiro
 * acesso em produção, onde ainda não existe nenhum usuário e o `db:seed`
 * (que apaga tudo e cria dados fictícios) NUNCA deve ser rodado.
 *
 * Uso interativo (recomendado):
 *   npx tsx scripts/criar-admin.ts
 *
 * Uso não-interativo (ex.: scripts automatizados):
 *   ADMIN_NOME="Seu Nome" ADMIN_EMAIL="voce@empresa.com.br" ADMIN_SENHA="senha-forte" npx tsx scripts/criar-admin.ts
 */
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function perguntar(pergunta: string, valorAtual?: string): Promise<string> {
  if (valorAtual) return valorAtual;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const resposta = await rl.question(pergunta);
  rl.close();
  return resposta.trim();
}

async function main() {
  console.log("== Criar usuário administrador ==\n");

  const nome = await perguntar("Nome: ", process.env.ADMIN_NOME);
  const emailBruto = await perguntar("E-mail: ", process.env.ADMIN_EMAIL);
  const senha = await perguntar("Senha (mínimo 6 caracteres): ", process.env.ADMIN_SENHA);

  const email = emailBruto.toLowerCase().trim();

  if (!nome || !email || !senha) {
    console.error("\nNome, e-mail e senha são obrigatórios.");
    process.exit(1);
  }
  if (senha.length < 6) {
    console.error("\nA senha precisa ter ao menos 6 caracteres.");
    process.exit(1);
  }
  if (!email.includes("@")) {
    console.error("\nE-mail inválido.");
    process.exit(1);
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { nome, senhaHash, papel: "ADMIN", ativo: true },
    create: { nome, email, senhaHash, papel: "ADMIN", ativo: true },
  });

  const config = await prisma.configEmpresa.findFirst();
  if (!config) {
    await prisma.configEmpresa.create({ data: {} });
    console.log("Configuração inicial da empresa criada com valores padrão (ajuste em Configurações depois de entrar).");
  }

  console.log(`\nUsuário admin "${usuario.nome}" (${usuario.email}) pronto. Já pode fazer login.`);
  await prisma.$disconnect();
}

main().catch(async (erro) => {
  console.error(erro);
  await prisma.$disconnect();
  process.exit(1);
});
