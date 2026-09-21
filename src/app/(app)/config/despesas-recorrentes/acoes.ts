"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth/exigir-usuario";
import { paraCentavos } from "@/lib/dinheiro";

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
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 28) {
    return { erro: "Dia de vencimento deve ser entre 1 e 28." };
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
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 28) {
    return { erro: "Dia de vencimento deve ser entre 1 e 28." };
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
