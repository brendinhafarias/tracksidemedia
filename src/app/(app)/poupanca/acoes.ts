"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth/exigir-usuario";
import { paraCentavos } from "@/lib/dinheiro";
import { agora } from "@/lib/data";
import { obterOuCriarCategoriasPoupanca, obterSaldoPoupanca } from "@/lib/poupanca";

export type EstadoMovimentoPoupanca = { erro?: string; sucesso?: boolean } | null;

export async function registrarMovimentoPoupanca(
  _estado: EstadoMovimentoPoupanca,
  formData: FormData
): Promise<EstadoMovimentoPoupanca> {
  await exigirUsuario();

  const tipo = formData.get("tipoMovimento");
  if (tipo !== "DEPOSITO" && tipo !== "RETIRADA") {
    return { erro: "Selecione se é um depósito ou uma retirada." };
  }

  const valor = paraCentavos(String(formData.get("valorTexto") ?? ""));
  if (valor <= 0) return { erro: "Informe um valor maior que zero." };

  const descricaoBruta = String(formData.get("descricao") ?? "").trim();
  const dataTexto = String(formData.get("data") ?? "");
  const [ano, mes, dia] = dataTexto.split("-").map(Number);
  const data = ano && mes && dia ? new Date(ano, mes - 1, dia) : agora();

  if (tipo === "RETIRADA") {
    const saldoAtual = await obterSaldoPoupanca();
    if (valor > saldoAtual) {
      return { erro: `O saldo atual da poupança é menor que o valor informado (saldo: ${(saldoAtual / 100).toFixed(2).replace(".", ",")}).` };
    }
  }

  const { deposito, retirada } = await obterOuCriarCategoriasPoupanca();

  await prisma.lancamento.create({
    data: {
      tipo: tipo === "DEPOSITO" ? "SAIDA" : "ENTRADA",
      valor,
      descricao: descricaoBruta || (tipo === "DEPOSITO" ? "Depósito na poupança" : "Retirada da poupança"),
      dataCaixa: data,
      competenciaMes: data.getMonth() + 1,
      competenciaAno: data.getFullYear(),
      categoriaId: tipo === "DEPOSITO" ? deposito.id : retirada.id,
      formaPagamento: "TRANSFERENCIA",
      status: "EFETIVADO",
      origem: "MANUAL",
    },
  });

  revalidatePath("/poupanca");
  revalidatePath("/lancamentos");
  revalidatePath("/");
  return { sucesso: true };
}

export type EstadoSaldoInicial = { erro?: string; sucesso?: boolean } | null;

/** Define o valor que a poupança já tinha antes de começar a usar o sistema. Não afeta Entradas/Saídas/Lucro de nenhum mês. */
export async function ajustarSaldoInicialPoupanca(
  _estado: EstadoSaldoInicial,
  formData: FormData
): Promise<EstadoSaldoInicial> {
  await exigirUsuario();

  const valor = paraCentavos(String(formData.get("valorTexto") ?? ""));
  if (valor < 0) return { erro: "Informe um valor maior ou igual a zero." };

  const existente = await prisma.configEmpresa.findFirst();
  if (existente) {
    await prisma.configEmpresa.update({
      where: { id: existente.id },
      data: { saldoInicialPoupanca: valor },
    });
  } else {
    await prisma.configEmpresa.create({ data: { saldoInicialPoupanca: valor } });
  }

  revalidatePath("/poupanca");
  return { sucesso: true };
}
