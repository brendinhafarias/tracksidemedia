"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth/exigir-usuario";
import { agora, diasEntre, nomeMes, formatarData } from "@/lib/data";
import { formatarBRL } from "@/lib/dinheiro";
import { obterRegime } from "@/lib/regime";
import { totaisPeriodo } from "@/lib/consultas/financeiro";
import { calcularDivisaoLucro } from "@/lib/divisao-lucro";
import { recalcularStatusCobranca } from "@/lib/cobrancas";
import { interpretarTexto } from "@/lib/assistente/interpretar-texto";
import { buscarPorNome, type ItemBusca } from "@/lib/assistente/buscar-nome";
import { sugerirNomeCategoriaDespesa } from "@/lib/assistente/categorizar-despesa";
import { paraInputData } from "@/lib/validacao/lancamento";
import type { IntencaoBruta } from "@/lib/assistente/tipos";
import type { CamposConfirmacao, RespostaAssistente } from "./tipos";

// ---------------------------------------------------------------------------
// Helpers de categoria
// ---------------------------------------------------------------------------

async function obterOuCriarCategoria(nome: string, tipo: "ENTRADA" | "SAIDA") {
  const existente = await prisma.categoria.findFirst({ where: { nome, tipo } });
  if (existente) return existente;
  const qualquerDoTipo = await prisma.categoria.findFirst({ where: { tipo, arquivada: false } });
  if (qualquerDoTipo) return qualquerDoTipo;
  return prisma.categoria.create({ data: { nome, tipo, cor: "#94a3b8" } });
}

// ---------------------------------------------------------------------------
// Limpeza de nomes capturados (remove artigos/pronomes que sobram do regex)
// ---------------------------------------------------------------------------

function limparNomeCapturado(nome: string): string {
  return nome
    .replace(/^(a|o|as|os|essa|esse|essas|esses|aquela|aquele|minha|meu)\s+/, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Ponto de entrada: interpreta o texto e decide a resposta
// ---------------------------------------------------------------------------

export async function processarMensagem(prompt: string): Promise<RespostaAssistente> {
  await exigirUsuario();
  const hoje = agora();
  const intencao = interpretarTexto(prompt, hoje);

  switch (intencao.acao) {
    case "CONSULTA_INADIMPLENCIA":
      return responderInadimplencia(hoje);
    case "CONSULTA_SITUACAO_CLIENTE":
      return responderSituacaoCliente(limparNomeCapturado(intencao.nomeCliente));
    case "CONSULTA_RESUMO_MES":
      return responderResumoMes(intencao.mes, intencao.ano);
    case "CONSULTA_DIVISAO_LUCRO":
      return responderDivisaoLucro(hoje);
    case "REGISTRAR_PAGAMENTO":
      return montarRegistroPagamento(intencao);
    case "REGISTRAR_DESPESA":
      return montarRegistroDespesa(intencao);
    case "REGISTRAR_RETIRADA_SOCIO":
      return montarRegistroRetirada(intencao);
    case "NAO_RECONHECIDO":
      return fallbackGenerico(intencao, hoje);
  }
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

async function responderInadimplencia(hoje: Date): Promise<RespostaAssistente> {
  const mes = hoje.getMonth() + 1;
  const ano = hoje.getFullYear();

  const cobrancas = await prisma.cobranca.findMany({
    where: { competenciaMes: mes, competenciaAno: ano, status: { in: ["ABERTA", "PARCIAL"] } },
    include: {
      cliente: true,
      lancamentos: { where: { tipo: "ENTRADA", status: "EFETIVADO", cancelado: false } },
    },
  });

  const linhas = cobrancas
    .map((c) => {
      const pago = c.lancamentos.reduce((soma, l) => soma + l.valor, 0);
      const restante = c.valorDevido - pago;
      const diasAtraso = Math.max(diasEntre(hoje, c.dataVencimento), 0);
      return { nome: c.cliente.nome, restante, diasAtraso };
    })
    .filter((l) => l.restante > 0)
    .sort((a, b) => b.restante - a.restante);

  if (linhas.length === 0) {
    return { tipo: "resposta", texto: `Ninguém está devendo em ${nomeMes(mes)}/${ano}. 🎉` };
  }

  const detalhe = linhas
    .map((l) => `• ${l.nome}: ${formatarBRL(l.restante)}${l.diasAtraso > 0 ? ` (${l.diasAtraso} dia(s) de atraso)` : " (dentro do prazo)"}`)
    .join("\n");

  return { tipo: "resposta", texto: `Em ${nomeMes(mes)}/${ano}, quem ainda deve:\n${detalhe}` };
}

async function responderSituacaoCliente(nomeDigitado: string): Promise<RespostaAssistente> {
  const clientes = await prisma.cliente.findMany({ where: { arquivado: false } });
  const resultado = buscarPorNome(nomeDigitado, clientes as ItemBusca[]);

  if (resultado.situacao === "nao_encontrado") {
    return { tipo: "resposta", texto: `Não encontrei nenhum cliente parecido com "${nomeDigitado}".` };
  }
  if (resultado.situacao === "ambiguo") {
    return {
      tipo: "escolha_consulta",
      candidatos: resultado.candidatos.map((c) => ({ id: c.id, nome: c.nome })),
    };
  }

  return responderSituacaoClientePorId(resultado.item.id);
}

export async function responderSituacaoClientePorId(clienteId: string): Promise<RespostaAssistente> {
  await exigirUsuario();
  const hoje = agora();
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) return { tipo: "resposta", texto: "Cliente não encontrado." };

  if (cliente.tipo !== "MENSALISTA") {
    return { tipo: "resposta", texto: `${cliente.nome} é cliente avulso — não tem mensalidade para acompanhar.` };
  }

  const cobrancaAtual = await prisma.cobranca.findFirst({
    where: { clienteId, competenciaMes: hoje.getMonth() + 1, competenciaAno: hoje.getFullYear() },
    include: { lancamentos: { where: { tipo: "ENTRADA", status: "EFETIVADO", cancelado: false } } },
  });

  if (!cobrancaAtual) {
    return { tipo: "resposta", texto: `${cliente.nome} ainda não tem cobrança gerada este mês.` };
  }

  const pago = cobrancaAtual.lancamentos.reduce((soma, l) => soma + l.valor, 0);
  const restante = cobrancaAtual.valorDevido - pago;

  if (restante <= 0) {
    return { tipo: "resposta", texto: `${cliente.nome} está em dia — a mensalidade deste mês já foi paga.` };
  }

  const diasAtraso = diasEntre(hoje, cobrancaAtual.dataVencimento);
  if (diasAtraso > 0) {
    return {
      tipo: "resposta",
      texto: `${cliente.nome} está devendo ${formatarBRL(restante)}, com ${diasAtraso} dia(s) de atraso (venceu em ${formatarData(cobrancaAtual.dataVencimento)}).`,
    };
  }

  return {
    tipo: "resposta",
    texto: `${cliente.nome} ainda não pagou este mês, mas o vencimento (${formatarData(cobrancaAtual.dataVencimento)}) ainda não chegou.`,
  };
}

async function responderResumoMes(mes: number, ano: number): Promise<RespostaAssistente> {
  const regime = await obterRegime();
  const totais = await totaisPeriodo(mes, ano, regime);
  const sinal = totais.lucro >= 0 ? "lucro" : "prejuízo";

  return {
    tipo: "resposta",
    texto: `Em ${nomeMes(mes)}/${ano}: entradas ${formatarBRL(totais.entradas)}, saídas ${formatarBRL(totais.saidas)}, ${sinal} de ${formatarBRL(Math.abs(totais.lucro))}.`,
  };
}

async function responderDivisaoLucro(hoje: Date): Promise<RespostaAssistente> {
  const regime = await obterRegime();
  const mes = hoje.getMonth() + 1;
  const ano = hoje.getFullYear();

  const [config, socios, totais] = await Promise.all([
    prisma.configEmpresa.findFirst(),
    prisma.socio.findMany({ where: { ativo: true } }),
    totaisPeriodo(mes, ano, regime),
  ]);

  if (totais.lucro <= 0) {
    return {
      tipo: "resposta",
      texto: `Não há lucro a distribuir em ${nomeMes(mes)}/${ano}: as saídas (${formatarBRL(totais.saidas)}) igualaram ou superaram as entradas (${formatarBRL(totais.entradas)}).`,
    };
  }

  const percentualReserva = config ? Number(config.percentualReserva) : 10;
  const divisao = calcularDivisaoLucro(
    totais.lucro,
    percentualReserva,
    socios.map((s) => ({ id: s.id, percentualLucro: Number(s.percentualLucro) }))
  );
  const cotaPorSocio = new Map(divisao.cotas.map((c) => [c.socioId, c.valor]));

  const detalhe = socios
    .map((s) => `• ${s.nome}: ${formatarBRL(cotaPorSocio.get(s.id) ?? 0)}`)
    .join("\n");

  return {
    tipo: "resposta",
    texto: `Divisão de ${nomeMes(mes)}/${ano} (lucro ${formatarBRL(totais.lucro)}, reserva ${percentualReserva}%):\n${detalhe || "Nenhum sócio ativo cadastrado."}`,
  };
}

// ---------------------------------------------------------------------------
// Lançamentos — montagem do cartão de confirmação (nunca grava aqui)
// ---------------------------------------------------------------------------

async function montarRegistroPagamento(
  intencao: Extract<IntencaoBruta, { acao: "REGISTRAR_PAGAMENTO" }>
): Promise<RespostaAssistente> {
  const baseCampos: CamposConfirmacao = {
    tipo: "ENTRADA",
    valorCentavos: intencao.valorCentavos ?? 0,
    descricao: "Pagamento recebido",
    dataCaixa: paraInputData(intencao.data),
    competenciaMes: intencao.competenciaMes,
    competenciaAno: intencao.competenciaAno,
    categoriaId: "",
    categoriaNome: "",
    clienteId: null,
    clienteNome: null,
    socioId: null,
    socioNome: null,
    cobrancaId: null,
    cobrancaInfo: null,
    acaoOrigem: "PAGAMENTO",
  };

  if (intencao.valorCentavos == null) {
    return { tipo: "fallback", motivo: "Não consegui identificar o valor recebido.", campos: baseCampos };
  }

  if (!intencao.nomeCliente) {
    const categoria = await obterOuCriarCategoria("Cobertura Real Time", "ENTRADA");
    return {
      tipo: "confirmacao",
      campos: { ...baseCampos, categoriaId: categoria.id, categoriaNome: categoria.nome },
    };
  }

  const clientes = await prisma.cliente.findMany({ where: { arquivado: false } });
  const resultado = buscarPorNome(limparNomeCapturado(intencao.nomeCliente), clientes as ItemBusca[]);

  if (resultado.situacao === "ambiguo") {
    const categoria = await obterOuCriarCategoria("Cobertura Real Time", "ENTRADA");
    return {
      tipo: "escolha",
      entidade: "cliente",
      candidatos: resultado.candidatos.map((c) => ({ id: c.id, nome: c.nome })),
      campos: { ...baseCampos, categoriaId: categoria.id, categoriaNome: categoria.nome },
    };
  }

  if (resultado.situacao === "nao_encontrado") {
    const categoria = await obterOuCriarCategoria("Cobertura Real Time", "ENTRADA");
    return {
      tipo: "sem_correspondencia",
      entidade: "cliente",
      nomeDigitado: intencao.nomeCliente,
      campos: { ...baseCampos, categoriaId: categoria.id, categoriaNome: categoria.nome },
    };
  }

  return montarConfirmacaoPagamentoComCliente(baseCampos, resultado.item.id);
}

/** Reaproveitado tanto no fluxo direto quanto após o usuário escolher um cliente. */
export async function montarConfirmacaoPagamentoComCliente(
  campos: CamposConfirmacao,
  clienteId: string
): Promise<RespostaAssistente> {
  await exigirUsuario();
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) return { tipo: "resposta", texto: "Cliente não encontrado." };

  const cobranca = await prisma.cobranca.findFirst({
    where: {
      clienteId,
      competenciaMes: campos.competenciaMes,
      competenciaAno: campos.competenciaAno,
      status: { in: ["ABERTA", "PARCIAL"] },
    },
  });

  const categoria = cobranca
    ? await obterOuCriarCategoria("Gestão de Mídias", "ENTRADA")
    : await obterOuCriarCategoria("Cobertura Real Time", "ENTRADA");

  return {
    tipo: "confirmacao",
    campos: {
      ...campos,
      categoriaId: categoria.id,
      categoriaNome: categoria.nome,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      cobrancaId: cobranca?.id ?? null,
      cobrancaInfo: cobranca
        ? `Vinculado à cobrança de ${nomeMes(cobranca.competenciaMes)}/${cobranca.competenciaAno} (devido ${formatarBRL(cobranca.valorDevido)}).`
        : null,
    },
  };
}

async function montarRegistroDespesa(
  intencao: Extract<IntencaoBruta, { acao: "REGISTRAR_DESPESA" }>
): Promise<RespostaAssistente> {
  const baseCampos: CamposConfirmacao = {
    tipo: "SAIDA",
    valorCentavos: intencao.valorCentavos ?? 0,
    descricao: capitalizar(intencao.textoOriginal),
    dataCaixa: paraInputData(intencao.data),
    competenciaMes: intencao.competenciaMes,
    competenciaAno: intencao.competenciaAno,
    categoriaId: "",
    categoriaNome: "",
    clienteId: null,
    clienteNome: null,
    socioId: null,
    socioNome: null,
    cobrancaId: null,
    cobrancaInfo: null,
    acaoOrigem: "DESPESA",
  };

  if (intencao.valorCentavos == null) {
    return { tipo: "fallback", motivo: "Não consegui identificar o valor da despesa.", campos: baseCampos };
  }

  const nomeCategoria = sugerirNomeCategoriaDespesa(intencao.textoNormalizado);
  const categoria = await obterOuCriarCategoria(nomeCategoria, "SAIDA");

  return {
    tipo: "confirmacao",
    campos: { ...baseCampos, categoriaId: categoria.id, categoriaNome: categoria.nome },
  };
}

async function montarRegistroRetirada(
  intencao: Extract<IntencaoBruta, { acao: "REGISTRAR_RETIRADA_SOCIO" }>
): Promise<RespostaAssistente> {
  const categoria = await obterOuCriarCategoria("Pró-labore", "SAIDA");

  const baseCampos: CamposConfirmacao = {
    tipo: "SAIDA",
    valorCentavos: intencao.valorCentavos ?? 0,
    descricao: "Retirada de sócio",
    dataCaixa: paraInputData(intencao.data),
    competenciaMes: intencao.competenciaMes,
    competenciaAno: intencao.competenciaAno,
    categoriaId: categoria.id,
    categoriaNome: categoria.nome,
    clienteId: null,
    clienteNome: null,
    socioId: null,
    socioNome: null,
    cobrancaId: null,
    cobrancaInfo: null,
    acaoOrigem: "RETIRADA_SOCIO",
    subtipoRetirada: intencao.subtipo,
  };

  if (intencao.valorCentavos == null) {
    return { tipo: "fallback", motivo: "Não consegui identificar o valor da retirada.", campos: baseCampos };
  }

  if (!intencao.nomeSocio) {
    return { tipo: "confirmacao", campos: baseCampos };
  }

  const socios = await prisma.socio.findMany({ where: { ativo: true } });
  const resultado = buscarPorNome(limparNomeCapturado(intencao.nomeSocio), socios as ItemBusca[]);

  if (resultado.situacao === "ambiguo") {
    return {
      tipo: "escolha",
      entidade: "socio",
      candidatos: resultado.candidatos.map((s) => ({ id: s.id, nome: s.nome })),
      campos: baseCampos,
    };
  }
  if (resultado.situacao === "nao_encontrado") {
    return { tipo: "confirmacao", campos: baseCampos };
  }

  return {
    tipo: "confirmacao",
    campos: { ...baseCampos, socioId: resultado.item.id, socioNome: resultado.item.nome },
  };
}

function fallbackGenerico(
  intencao: Extract<IntencaoBruta, { acao: "NAO_RECONHECIDO" }>,
  hoje: Date
): RespostaAssistente {
  return {
    tipo: "fallback",
    motivo: "Não entendi essa frase. Preencha os campos abaixo para lançar manualmente.",
    campos: {
      tipo: "SAIDA",
      valorCentavos: 0,
      descricao: capitalizar(intencao.textoOriginal),
      dataCaixa: paraInputData(hoje),
      competenciaMes: hoje.getMonth() + 1,
      competenciaAno: hoje.getFullYear(),
      categoriaId: "",
      categoriaNome: "",
      clienteId: null,
      clienteNome: null,
      socioId: null,
      socioNome: null,
      cobrancaId: null,
      cobrancaInfo: null,
      acaoOrigem: "DESPESA",
    },
  };
}

function capitalizar(texto: string): string {
  const t = texto.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ---------------------------------------------------------------------------
// Escolha de cliente/sócio ambíguo (fluxo de lançamento) — reconstrói a confirmação
// ---------------------------------------------------------------------------

/** Cadastro rápido de cliente a partir do chat, quando nenhuma correspondência foi encontrada. */
export async function criarClienteRapido(
  nome: string
): Promise<{ id: string; nome: string } | { erro: string }> {
  await exigirUsuario();
  const nomeLimpo = nome.trim();
  if (!nomeLimpo) return { erro: "Informe um nome." };

  const cliente = await prisma.cliente.create({
    data: { nome: nomeLimpo, tipo: "AVULSO" },
  });

  revalidatePath("/clientes");
  return { id: cliente.id, nome: cliente.nome };
}

export async function resolverEscolhaSocio(
  campos: CamposConfirmacao,
  socioId: string
): Promise<RespostaAssistente> {
  await exigirUsuario();
  const socio = await prisma.socio.findUnique({ where: { id: socioId } });
  if (!socio) return { tipo: "resposta", texto: "Sócio não encontrado." };
  return { tipo: "confirmacao", campos: { ...campos, socioId: socio.id, socioNome: socio.nome } };
}

// ---------------------------------------------------------------------------
// Confirmação final: só aqui algo é gravado no banco
// ---------------------------------------------------------------------------

export type ResultadoConfirmacao = { erro?: string; lancamentoId?: string; resumo?: string };

export async function confirmarAcaoAssistente(
  campos: CamposConfirmacao,
  promptOriginal: string
): Promise<ResultadoConfirmacao> {
  const usuario = await exigirUsuario();

  if (campos.valorCentavos <= 0) return { erro: "Informe um valor maior que zero." };
  if (!campos.categoriaId) return { erro: "Selecione uma categoria." };
  if (!campos.descricao.trim()) return { erro: "Informe uma descrição." };

  const [ano, mes, dia] = campos.dataCaixa.split("-").map(Number);
  const dataCaixa = ano && mes && dia ? new Date(ano, mes - 1, dia) : agora();

  const lancamento = await prisma.lancamento.create({
    data: {
      tipo: campos.tipo,
      valor: campos.valorCentavos,
      descricao: campos.descricao.trim(),
      dataCaixa,
      competenciaMes: campos.competenciaMes,
      competenciaAno: campos.competenciaAno,
      categoriaId: campos.categoriaId,
      clienteId: campos.clienteId,
      socioId: campos.socioId,
      cobrancaId: campos.cobrancaId,
      formaPagamento: "PIX",
      status: "EFETIVADO",
      origem: "ASSISTENTE",
    },
  });

  if (campos.cobrancaId) await recalcularStatusCobranca(campos.cobrancaId);

  if (campos.acaoOrigem === "RETIRADA_SOCIO" && campos.socioId) {
    await prisma.distribuicao.create({
      data: {
        socioId: campos.socioId,
        competenciaMes: campos.competenciaMes,
        competenciaAno: campos.competenciaAno,
        tipo: campos.subtipoRetirada ?? "ADIANTAMENTO",
        valor: campos.valorCentavos,
        dataPagamento: dataCaixa,
        lancamentoId: lancamento.id,
      },
    });
  }

  await prisma.logAssistente.create({
    data: {
      prompt: promptOriginal,
      interpretacao: JSON.stringify(campos),
      acaoExecutada: campos.acaoOrigem,
      entidadeId: campos.clienteId ?? campos.socioId ?? undefined,
      lancamentoId: lancamento.id,
      usuarioId: usuario.id,
    },
  });

  revalidatePath("/lancamentos");
  revalidatePath("/mensalidades");
  revalidatePath("/clientes");
  revalidatePath("/socios");
  revalidatePath("/");

  const resumo = `${campos.tipo === "ENTRADA" ? "Entrada" : "Saída"} de ${formatarBRL(campos.valorCentavos)} registrada${campos.clienteNome ? ` (${campos.clienteNome})` : ""}${campos.socioNome ? ` (${campos.socioNome})` : ""}.`;

  return { lancamentoId: lancamento.id, resumo };
}

export async function desfazerAcaoAssistente(lancamentoId: string): Promise<{ erro?: string }> {
  await exigirUsuario();

  const lancamento = await prisma.lancamento.findUnique({ where: { id: lancamentoId } });
  if (!lancamento || lancamento.origem !== "ASSISTENTE") {
    return { erro: "Este lançamento não pode ser desfeito por aqui." };
  }

  await prisma.lancamento.update({
    where: { id: lancamentoId },
    data: { cancelado: true, status: "CANCELADO" },
  });

  if (lancamento.cobrancaId) await recalcularStatusCobranca(lancamento.cobrancaId);

  await prisma.logAssistente.updateMany({
    where: { lancamentoId },
    data: { desfeito: true },
  });

  revalidatePath("/lancamentos");
  revalidatePath("/mensalidades");
  revalidatePath("/clientes");
  revalidatePath("/socios");
  revalidatePath("/");

  return {};
}
