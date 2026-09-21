"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth/exigir-usuario";
import { recalcularStatusCobranca } from "@/lib/cobrancas";
import { paraCentavos } from "@/lib/dinheiro";
import { agora } from "@/lib/data";
import { FORMAS_PAGAMENTO } from "@/lib/validacao/lancamento";

export type ResultadoGeracao = { criadas: number; existentes: number };

/**
 * Gera as cobranças do mês/ano informado para todos os clientes mensalistas
 * ativos. Idempotente: cobranças já existentes (mesmo cliente + competência)
 * não são duplicadas.
 */
export async function gerarMensalidades(
  mes: number,
  ano: number
): Promise<ResultadoGeracao> {
  await exigirUsuario();

  const clientes = await prisma.cliente.findMany({
    where: { tipo: "MENSALISTA", arquivado: false },
  });

  let criadas = 0;
  let existentes = 0;

  for (const cliente of clientes) {
    if (!cliente.valorMensal || !cliente.diaVencimento) continue;

    const jaExiste = await prisma.cobranca.findUnique({
      where: {
        clienteId_competenciaMes_competenciaAno: {
          clienteId: cliente.id,
          competenciaMes: mes,
          competenciaAno: ano,
        },
      },
    });

    if (jaExiste) {
      existentes++;
      continue;
    }

    await prisma.cobranca.create({
      data: {
        clienteId: cliente.id,
        competenciaMes: mes,
        competenciaAno: ano,
        valorDevido: cliente.valorMensal,
        dataVencimento: new Date(ano, mes - 1, cliente.diaVencimento),
        status: "ABERTA",
      },
    });
    criadas++;
  }

  revalidatePath("/mensalidades");
  return { criadas, existentes };
}

async function categoriaMensalidades() {
  const categoria = await prisma.categoria.findFirst({
    where: { nome: "Gestão de Mídias", tipo: "ENTRADA" },
  });
  if (categoria) return categoria.id;
  // fallback: qualquer categoria de entrada, para nunca travar a ação
  const qualquer = await prisma.categoria.findFirst({ where: { tipo: "ENTRADA" } });
  if (qualquer) return qualquer.id;
  const criada = await prisma.categoria.create({
    data: { nome: "Gestão de Mídias", tipo: "ENTRADA", cor: "#22c55e" },
  });
  return criada.id;
}

export type EstadoRegistroPagamento = { erro?: string; sucesso?: boolean } | null;

/** Ação rápida da grade: registra o pagamento total (valor restante) na data de hoje. */
export async function marcarComoPagaHoje(cobrancaId: string) {
  await exigirUsuario();

  const cobranca = await prisma.cobranca.findUnique({ where: { id: cobrancaId } });
  if (!cobranca) throw new Error("Cobrança não encontrada.");

  const soma = await prisma.lancamento.aggregate({
    where: { cobrancaId, tipo: "ENTRADA", status: "EFETIVADO", cancelado: false },
    _sum: { valor: true },
  });
  const restante = cobranca.valorDevido - (soma._sum.valor ?? 0);
  if (restante <= 0) return;

  const categoriaId = await categoriaMensalidades();

  await prisma.lancamento.create({
    data: {
      tipo: "ENTRADA",
      valor: restante,
      descricao: "Mensalidade recebida",
      dataCaixa: agora(),
      competenciaMes: cobranca.competenciaMes,
      competenciaAno: cobranca.competenciaAno,
      categoriaId,
      clienteId: cobranca.clienteId,
      cobrancaId: cobranca.id,
      formaPagamento: "PIX",
      status: "EFETIVADO",
      origem: "MANUAL",
    },
  });

  await recalcularStatusCobranca(cobrancaId);
  revalidatePath("/mensalidades");
  revalidatePath("/lancamentos");
  revalidatePath("/clientes");
}

/** Registra um pagamento (total ou parcial) com valor e data escolhidos manualmente. */
export async function registrarPagamentoCobranca(
  cobrancaId: string,
  _estado: EstadoRegistroPagamento,
  formData: FormData
): Promise<EstadoRegistroPagamento> {
  await exigirUsuario();

  const valorTexto = String(formData.get("valorTexto") ?? "");
  const dataTexto = String(formData.get("data") ?? "");
  const formaPagamentoTexto = String(formData.get("formaPagamento") ?? "PIX");
  const formaPagamento = FORMAS_PAGAMENTO.includes(formaPagamentoTexto as (typeof FORMAS_PAGAMENTO)[number])
    ? (formaPagamentoTexto as (typeof FORMAS_PAGAMENTO)[number])
    : "PIX";

  const valor = paraCentavos(valorTexto);
  if (valor <= 0) return { erro: "Informe um valor maior que zero." };

  const [ano, mes, dia] = dataTexto.split("-").map(Number);
  const data = ano && mes && dia ? new Date(ano, mes - 1, dia) : agora();

  const cobranca = await prisma.cobranca.findUnique({ where: { id: cobrancaId } });
  if (!cobranca) return { erro: "Cobrança não encontrada." };

  const categoriaId = await categoriaMensalidades();

  await prisma.lancamento.create({
    data: {
      tipo: "ENTRADA",
      valor,
      descricao: "Mensalidade recebida",
      dataCaixa: data,
      competenciaMes: cobranca.competenciaMes,
      competenciaAno: cobranca.competenciaAno,
      categoriaId,
      clienteId: cobranca.clienteId,
      cobrancaId: cobranca.id,
      formaPagamento,
      status: "EFETIVADO",
      origem: "MANUAL",
    },
  });

  await recalcularStatusCobranca(cobrancaId);
  revalidatePath("/mensalidades");
  revalidatePath("/lancamentos");
  revalidatePath("/clientes");
  return { sucesso: true };
}
