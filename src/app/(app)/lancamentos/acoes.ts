"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth/exigir-usuario";
import { paraCentavos } from "@/lib/dinheiro";
import { recalcularStatusCobranca } from "@/lib/cobrancas";
import {
  esquemaLancamento,
  paraDataLocal,
  FORMAS_PAGAMENTO,
} from "@/lib/validacao/lancamento";

export type EstadoFormulario = { erro?: string; sucesso?: boolean } | null;

function extrairDados(formData: FormData) {
  return esquemaLancamento.safeParse({
    tipo: formData.get("tipo"),
    valorTexto: formData.get("valorTexto"),
    descricao: formData.get("descricao"),
    dataCaixa: formData.get("dataCaixa"),
    competenciaMes: formData.get("competenciaMes"),
    competenciaAno: formData.get("competenciaAno"),
    categoriaId: formData.get("categoriaId"),
    clienteId: formData.get("clienteId"),
    formaPagamento: formData.get("formaPagamento"),
  });
}

export async function criarLancamento(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirUsuario();
  const dados = extrairDados(formData);
  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const valor = paraCentavos(dados.data.valorTexto);
  if (valor <= 0) {
    return { erro: "Informe um valor maior que zero." };
  }

  const dataCaixa = paraDataLocal(dados.data.dataCaixa);

  const erroReferencia = await validarReferencias(dados.data.categoriaId, dados.data.clienteId);
  if (erroReferencia) return { erro: erroReferencia };

  await prisma.lancamento.create({
    data: {
      tipo: dados.data.tipo,
      valor,
      descricao: dados.data.descricao,
      dataCaixa,
      competenciaMes: dados.data.competenciaMes,
      competenciaAno: dados.data.competenciaAno,
      categoriaId: dados.data.categoriaId,
      clienteId: dados.data.clienteId || null,
      formaPagamento: dados.data.formaPagamento,
      status: dataCaixa ? "EFETIVADO" : "PREVISTO",
      origem: "MANUAL",
    },
  });

  revalidatePath("/lancamentos");
  revalidatePath("/clientes");
  return { sucesso: true };
}

/**
 * Confere se a categoria (e o cliente, se informado) ainda existem antes de gravar.
 * Evita o erro genérico de "foreign key" quando o formulário ficou aberto com
 * uma lista desatualizada (ex.: categoria removida, ou o navegador com a aba
 * aberta de antes de uma atualização do banco).
 */
async function validarReferencias(categoriaId: string, clienteId?: string | null): Promise<string | null> {
  const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } });
  if (!categoria) {
    return "Essa categoria não existe mais. Atualize a página (F5) e selecione a categoria de novo.";
  }
  if (clienteId) {
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) {
      return "Esse cliente não existe mais. Atualize a página (F5) e selecione o cliente de novo.";
    }
  }
  return null;
}

export async function atualizarLancamento(
  id: string,
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirUsuario();
  const dados = extrairDados(formData);
  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const valor = paraCentavos(dados.data.valorTexto);
  if (valor <= 0) {
    return { erro: "Informe um valor maior que zero." };
  }

  const dataCaixa = paraDataLocal(dados.data.dataCaixa);

  const erroReferencia = await validarReferencias(dados.data.categoriaId, dados.data.clienteId);
  if (erroReferencia) return { erro: erroReferencia };

  const atualizado = await prisma.lancamento.update({
    where: { id },
    data: {
      tipo: dados.data.tipo,
      valor,
      descricao: dados.data.descricao,
      dataCaixa,
      competenciaMes: dados.data.competenciaMes,
      competenciaAno: dados.data.competenciaAno,
      categoriaId: dados.data.categoriaId,
      clienteId: dados.data.clienteId || null,
      formaPagamento: dados.data.formaPagamento,
      status: dataCaixa ? "EFETIVADO" : "PREVISTO",
    },
  });

  if (atualizado.cobrancaId) await recalcularStatusCobranca(atualizado.cobrancaId);

  revalidatePath("/lancamentos");
  revalidatePath("/clientes");
  revalidatePath("/mensalidades");
  return { sucesso: true };
}

export async function cancelarLancamento(id: string) {
  await exigirUsuario();
  const cancelado = await prisma.lancamento.update({
    where: { id },
    data: { cancelado: true, status: "CANCELADO" },
  });
  if (cancelado.cobrancaId) await recalcularStatusCobranca(cancelado.cobrancaId);
  revalidatePath("/lancamentos");
  revalidatePath("/clientes");
  revalidatePath("/mensalidades");
}

export async function atualizarDescricaoLancamento(id: string, descricao: string) {
  await exigirUsuario();
  const texto = descricao.trim();
  if (!texto) return;
  await prisma.lancamento.update({ where: { id }, data: { descricao: texto } });
  revalidatePath("/lancamentos");
}

export async function atualizarValorLancamento(id: string, valorTexto: string) {
  await exigirUsuario();
  const valor = paraCentavos(valorTexto);
  if (valor <= 0) return;
  const atualizado = await prisma.lancamento.update({ where: { id }, data: { valor } });
  if (atualizado.cobrancaId) await recalcularStatusCobranca(atualizado.cobrancaId);
  revalidatePath("/lancamentos");
  revalidatePath("/mensalidades");
}

export async function atualizarFormaPagamentoLancamento(
  id: string,
  formaPagamento: (typeof FORMAS_PAGAMENTO)[number]
) {
  await exigirUsuario();
  await prisma.lancamento.update({ where: { id }, data: { formaPagamento } });
  revalidatePath("/lancamentos");
}
