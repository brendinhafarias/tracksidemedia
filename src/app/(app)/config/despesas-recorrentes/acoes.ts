"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth/exigir-usuario";
import { paraCentavos } from "@/lib/dinheiro";
import { obterRegime } from "@/lib/regime";
import { totaisPeriodo } from "@/lib/consultas/financeiro";
import { nomeMes } from "@/lib/data";

export type EstadoFormulario = { erro?: string; sucesso?: boolean } | null;

const esquemaDespesa = z.object({
  descricao: z.string().trim().min(1, "Informe a descrição."),
  valorTexto: z.string().trim().min(1, "Informe o valor."),
  categoriaId: z.string().min(1, "Selecione uma categoria."),
  diaVencimentoTexto: z.string().trim().min(1),
});

function extrair(formData: FormData) {
  return esquemaDespesa.safeParse({
    descricao: formData.get("descricao"),
    valorTexto: formData.get("valorTexto"),
    categoriaId: formData.get("categoriaId"),
    diaVencimentoTexto: formData.get("diaVencimentoTexto"),
  });
}

export async function criarDespesaRecorrente(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirUsuario();
  const dados = extrair(formData);
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };

  const valor = paraCentavos(dados.data.valorTexto);
  if (valor <= 0) return { erro: "Informe um valor maior que zero." };
  const diaVencimento = Number(dados.data.diaVencimentoTexto);
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) {
    return { erro: "Dia de vencimento deve ser entre 1 e 31." };
  }

  await prisma.despesaRecorrente.create({
    data: {
      descricao: dados.data.descricao,
      valor,
      categoriaId: dados.data.categoriaId,
      diaVencimento,
    },
  });

  revalidatePath("/config/despesas-recorrentes");
  return { sucesso: true };
}

export async function atualizarDespesaRecorrente(
  id: string,
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirUsuario();
  const dados = extrair(formData);
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };

  const valor = paraCentavos(dados.data.valorTexto);
  if (valor <= 0) return { erro: "Informe um valor maior que zero." };
  const diaVencimento = Number(dados.data.diaVencimentoTexto);
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) {
    return { erro: "Dia de vencimento deve ser entre 1 e 31." };
  }

  await prisma.despesaRecorrente.update({
    where: { id },
    data: {
      descricao: dados.data.descricao,
      valor,
      categoriaId: dados.data.categoriaId,
      diaVencimento,
    },
  });

  revalidatePath("/config/despesas-recorrentes");
  return { sucesso: true };
}

export async function alternarAtivaDespesaRecorrente(id: string, ativa: boolean) {
  await exigirUsuario();
  await prisma.despesaRecorrente.update({ where: { id }, data: { ativa } });
  revalidatePath("/config/despesas-recorrentes");
}

export type ResultadoGeracaoDespesas = { criadas: number; existentes: number };

/** Gera lançamentos PREVISTO para o mês/ano a partir das despesas recorrentes ativas. Idempotente. */
export async function gerarLancamentosDespesasRecorrentes(
  mes: number,
  ano: number
): Promise<ResultadoGeracaoDespesas> {
  await exigirUsuario();

  const despesas = await prisma.despesaRecorrente.findMany({ where: { ativa: true } });
  let criadas = 0;
  let existentes = 0;

  for (const despesa of despesas) {
    const jaExiste = await prisma.lancamento.findFirst({
      where: {
        despesaRecorrenteId: despesa.id,
        competenciaMes: mes,
        competenciaAno: ano,
      },
    });

    if (jaExiste) {
      existentes++;
      continue;
    }

    await prisma.lancamento.create({
      data: {
        tipo: "SAIDA",
        valor: despesa.valor,
        descricao: despesa.descricao,
        dataCaixa: null,
        competenciaMes: mes,
        competenciaAno: ano,
        categoriaId: despesa.categoriaId,
        despesaRecorrenteId: despesa.id,
        formaPagamento: "PIX",
        status: "PREVISTO",
        origem: "RECORRENTE",
      },
    });
    criadas++;
  }

  revalidatePath("/lancamentos");
  revalidatePath("/");
  return { criadas, existentes };
}

async function categoriaImpostos() {
  const categoria = await prisma.categoria.findFirst({
    where: { nome: "Impostos", tipo: "SAIDA" },
  });
  if (categoria) return categoria.id;
  const criada = await prisma.categoria.create({
    data: { nome: "Impostos", tipo: "SAIDA", cor: "#b91c1c" },
  });
  return criada.id;
}

export type PrevisaoImposto = { percentual: number; entradas: number; valorImposto: number };

/** Calcula (sem gravar) o imposto estimado do mês, com base nas entradas já efetivadas. */
export async function calcularPrevisaoImposto(mes: number, ano: number): Promise<PrevisaoImposto> {
  await exigirUsuario();
  const config = await prisma.configEmpresa.findFirst();
  const percentual = config ? Number(config.percentualImposto) : 0;
  const regime = await obterRegime();
  const { entradas } = await totaisPeriodo(mes, ano, regime);
  const valorImposto = Math.round((entradas * percentual) / 100);
  return { percentual, entradas, valorImposto };
}

export type ResultadoGeracaoImposto =
  | { erro: string }
  | { criado: true; valor: number }
  | { criado: false; existente: true };

/** Gera o lançamento PREVISTO do imposto (Simples Nacional) do mês, calculado sobre as entradas já efetivadas. Idempotente. */
export async function gerarLancamentoImposto(mes: number, ano: number): Promise<ResultadoGeracaoImposto> {
  await exigirUsuario();

  const config = await prisma.configEmpresa.findFirst();
  const percentual = config ? Number(config.percentualImposto) : 0;
  if (!percentual || percentual <= 0) {
    return { erro: "Configure a alíquota de imposto em Configurações antes de gerar." };
  }

  const jaExiste = await prisma.lancamento.findFirst({
    where: { origem: "IMPOSTO", competenciaMes: mes, competenciaAno: ano },
  });
  if (jaExiste) {
    return { criado: false, existente: true };
  }

  const regime = await obterRegime();
  const { entradas } = await totaisPeriodo(mes, ano, regime);
  const valorImposto = Math.round((entradas * percentual) / 100);
  if (valorImposto <= 0) {
    return { erro: "Ainda não há entradas lançadas neste mês para calcular o imposto." };
  }

  const categoriaId = await categoriaImpostos();

  await prisma.lancamento.create({
    data: {
      tipo: "SAIDA",
      valor: valorImposto,
      descricao: `DAS - Simples Nacional (${percentual}% sobre ${nomeMes(mes)}/${ano})`,
      dataCaixa: null,
      competenciaMes: mes,
      competenciaAno: ano,
      categoriaId,
      formaPagamento: "PIX",
      status: "PREVISTO",
      origem: "IMPOSTO",
    },
  });

  revalidatePath("/lancamentos");
  revalidatePath("/");
  return { criado: true, valor: valorImposto };
}
