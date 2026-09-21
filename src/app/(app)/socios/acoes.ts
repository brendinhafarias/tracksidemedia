"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth/exigir-usuario";
import { paraCentavos } from "@/lib/dinheiro";
import { agora } from "@/lib/data";
import { esquemaSocio } from "@/lib/validacao/socio";

export type EstadoFormulario = { erro?: string; sucesso?: boolean } | null;

function extrairDados(formData: FormData) {
  return esquemaSocio.safeParse({
    nome: formData.get("nome"),
    percentualLucroTexto: formData.get("percentualLucroTexto"),
    proLaboreMensalTexto: formData.get("proLaboreMensalTexto"),
  });
}

function paraPercentual(texto: string): number {
  return Number(texto.replace(",", "."));
}

export async function criarSocio(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirUsuario();
  const dados = extrairDados(formData);
  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const percentualLucro = paraPercentual(dados.data.percentualLucroTexto);
  if (Number.isNaN(percentualLucro) || percentualLucro < 0 || percentualLucro > 100) {
    return { erro: "Informe um percentual entre 0 e 100." };
  }

  await prisma.socio.create({
    data: {
      nome: dados.data.nome,
      percentualLucro,
      proLaboreMensal: dados.data.proLaboreMensalTexto
        ? paraCentavos(dados.data.proLaboreMensalTexto)
        : null,
    },
  });

  revalidatePath("/socios");
  return { sucesso: true };
}

export async function atualizarSocio(
  id: string,
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirUsuario();
  const dados = extrairDados(formData);
  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const percentualLucro = paraPercentual(dados.data.percentualLucroTexto);
  if (Number.isNaN(percentualLucro) || percentualLucro < 0 || percentualLucro > 100) {
    return { erro: "Informe um percentual entre 0 e 100." };
  }

  await prisma.socio.update({
    where: { id },
    data: {
      nome: dados.data.nome,
      percentualLucro,
      proLaboreMensal: dados.data.proLaboreMensalTexto
        ? paraCentavos(dados.data.proLaboreMensalTexto)
        : null,
    },
  });

  revalidatePath("/socios");
  return { sucesso: true };
}

export async function alternarAtivoSocio(id: string, ativo: boolean) {
  await exigirUsuario();
  await prisma.socio.update({ where: { id }, data: { ativo } });
  revalidatePath("/socios");
}

async function categoriaDistribuicao() {
  const categoria = await prisma.categoria.findFirst({
    where: { nome: "Pró-labore", tipo: "SAIDA" },
  });
  if (categoria) return categoria.id;
  const qualquer = await prisma.categoria.findFirst({ where: { tipo: "SAIDA" } });
  if (qualquer) return qualquer.id;
  const criada = await prisma.categoria.create({
    data: { nome: "Pró-labore", tipo: "SAIDA", cor: "#0ea5e9" },
  });
  return criada.id;
}

export type ResultadoRetirada = { erro?: string; sucesso?: boolean };

/** Registra a retirada de lucro de um sócio para o mês/ano calculado na tela. */
export async function registrarRetiradaLucro(
  socioId: string,
  mes: number,
  ano: number,
  valor: number
): Promise<ResultadoRetirada> {
  await exigirUsuario();

  if (valor <= 0) return { erro: "Não há valor a distribuir." };

  const jaExiste = await prisma.distribuicao.findFirst({
    where: { socioId, competenciaMes: mes, competenciaAno: ano, tipo: "LUCRO" },
  });
  if (jaExiste) return { erro: "Este sócio já teve a retirada deste mês registrada." };

  const socio = await prisma.socio.findUnique({ where: { id: socioId } });
  if (!socio) return { erro: "Sócio não encontrado." };

  const categoriaId = await categoriaDistribuicao();
  const hoje = agora();

  const lancamento = await prisma.lancamento.create({
    data: {
      tipo: "SAIDA",
      valor,
      descricao: `Distribuição de lucro - ${socio.nome}`,
      dataCaixa: hoje,
      competenciaMes: mes,
      competenciaAno: ano,
      categoriaId,
      socioId,
      formaPagamento: "TRANSFERENCIA",
      status: "EFETIVADO",
      origem: "MANUAL",
    },
  });

  await prisma.distribuicao.create({
    data: {
      socioId,
      competenciaMes: mes,
      competenciaAno: ano,
      tipo: "LUCRO",
      valor,
      dataPagamento: hoje,
      lancamentoId: lancamento.id,
    },
  });

  revalidatePath("/socios");
  revalidatePath("/lancamentos");
  revalidatePath("/");
  return { sucesso: true };
}
