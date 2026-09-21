"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth/exigir-usuario";
import { buscarPorNome, type ItemBusca } from "@/lib/assistente/buscar-nome";
import { normalizarLinha } from "@/lib/importacao/normalizar-linha";
import type { MapeamentoColunas, LinhaProcessada } from "@/lib/importacao/tipos";
import { FORMAS_PAGAMENTO } from "@/lib/validacao/lancamento";

export type PlanilhaLida = {
  abas: string[];
  abaSelecionada: string;
  cabecalhos: string[];
  linhas: Record<string, unknown>[];
};

export type ResultadoLeitura = PlanilhaLida | { erro: string };

export async function lerPlanilha(formData: FormData): Promise<ResultadoLeitura> {
  await exigirUsuario();

  const arquivo = formData.get("arquivo");
  const abaEscolhida = formData.get("aba");
  if (!(arquivo instanceof File)) return { erro: "Selecione um arquivo .xlsx ou .csv." };

  let livro: XLSX.WorkBook;
  try {
    const buffer = await arquivo.arrayBuffer();
    livro = XLSX.read(buffer, { type: "array", cellDates: false });
  } catch {
    return { erro: "Não foi possível ler este arquivo. Verifique se é um .xlsx ou .csv válido." };
  }

  const abas = livro.SheetNames;
  if (abas.length === 0) return { erro: "A planilha não tem nenhuma aba." };

  const abaSelecionada = typeof abaEscolhida === "string" && abas.includes(abaEscolhida) ? abaEscolhida : abas[0];
  const planilha = livro.Sheets[abaSelecionada];

  const linhasComoMatriz: unknown[][] = XLSX.utils.sheet_to_json(planilha, { header: 1, defval: null, blankrows: false });
  if (linhasComoMatriz.length === 0) {
    return { abas, abaSelecionada, cabecalhos: [], linhas: [] };
  }

  const cabecalhosBrutos = linhasComoMatriz[0].map((c) => (c == null ? "" : String(c).trim()));
  const cabecalhos = cabecalhosBrutos.map((c, i) => c || `Coluna ${i + 1}`);

  const linhas: Record<string, unknown>[] = linhasComoMatriz.slice(1).map((linha) => {
    const objeto: Record<string, unknown> = {};
    cabecalhos.forEach((cab, i) => {
      objeto[cab] = linha[i] ?? null;
    });
    return objeto;
  });

  return { abas, abaSelecionada, cabecalhos, linhas };
}

export type ResultadoPreVisualizacao = {
  total: number;
  validas: number;
  comAviso: number;
  invalidas: number;
  ignoradas: number;
  amostra: LinhaProcessada[];
};

export async function preVisualizarImportacao(
  linhas: Record<string, unknown>[],
  cabecalhos: string[],
  mapeamento: MapeamentoColunas
): Promise<ResultadoPreVisualizacao> {
  await exigirUsuario();

  const [categorias, clientes] = await Promise.all([
    prisma.categoria.findMany({ where: { arquivada: false } }),
    prisma.cliente.findMany({ where: { arquivado: false } }),
  ]);

  let validas = 0;
  let comAviso = 0;
  let invalidas = 0;
  let ignoradas = 0;
  const amostra: LinhaProcessada[] = [];

  linhas.forEach((linhaBruta, indice) => {
    const processada = normalizarLinha(indice + 2, linhaBruta, mapeamento, cabecalhos);

    if (processada.ignorada) {
      ignoradas++;
    } else if (processada.erros.length > 0) {
      invalidas++;
    } else {
      if (processada.categoriaNome) {
        const r = buscarPorNome(processada.categoriaNome, categorias as ItemBusca[]);
        if (r.situacao !== "encontrado") {
          processada.avisos.push(`Categoria "${processada.categoriaNome}" não encontrada — será usada uma categoria padrão.`);
        }
      }
      if (processada.clienteNome) {
        const r = buscarPorNome(processada.clienteNome, clientes as ItemBusca[]);
        if (r.situacao !== "encontrado") {
          processada.avisos.push(`Cliente "${processada.clienteNome}" não encontrado — o lançamento será importado sem cliente vinculado.`);
        }
      }
      if (processada.avisos.length > 0) comAviso++;
      else validas++;
    }

    if (indice < 20) amostra.push(processada);
  });

  return { total: linhas.length, validas, comAviso, invalidas, ignoradas, amostra };
}

async function categoriaPadrao(tipo: "ENTRADA" | "SAIDA") {
  const nome = tipo === "ENTRADA" ? "Cobertura Real Time" : "Outras despesas";
  const existente = await prisma.categoria.findFirst({ where: { nome, tipo } });
  if (existente) return existente;
  const qualquer = await prisma.categoria.findFirst({ where: { tipo, arquivada: false } });
  if (qualquer) return qualquer;
  return prisma.categoria.create({ data: { nome, tipo, cor: "#94a3b8" } });
}

export type ResultadoImportacao = {
  loteId: string;
  importados: number;
  ignorados: number;
  invalidos: number;
  detalhesInvalidos: { linha: number; motivos: string[] }[];
};

export async function confirmarImportacao(
  linhas: Record<string, unknown>[],
  cabecalhos: string[],
  mapeamento: MapeamentoColunas
): Promise<ResultadoImportacao> {
  await exigirUsuario();

  const loteId = `lote_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const [categorias, clientes] = await Promise.all([
    prisma.categoria.findMany({ where: { arquivada: false } }),
    prisma.cliente.findMany({ where: { arquivado: false } }),
  ]);

  let importados = 0;
  let ignorados = 0;
  const detalhesInvalidos: { linha: number; motivos: string[] }[] = [];

  for (let indice = 0; indice < linhas.length; indice++) {
    const processada = normalizarLinha(indice + 2, linhas[indice], mapeamento, cabecalhos);

    if (processada.ignorada) {
      ignorados++;
      continue;
    }
    if (processada.erros.length > 0 || !processada.tipo || processada.valorCentavos == null || !processada.descricao) {
      detalhesInvalidos.push({ linha: processada.linha, motivos: processada.erros });
      continue;
    }

    let categoriaId: string;
    if (processada.categoriaNome) {
      const r = buscarPorNome(processada.categoriaNome, categorias.filter((c) => c.tipo === processada.tipo) as ItemBusca[]);
      categoriaId = r.situacao === "encontrado" ? r.item.id : (await categoriaPadrao(processada.tipo)).id;
    } else {
      categoriaId = (await categoriaPadrao(processada.tipo)).id;
    }

    let clienteId: string | null = null;
    if (processada.clienteNome) {
      const r = buscarPorNome(processada.clienteNome, clientes as ItemBusca[]);
      if (r.situacao === "encontrado") clienteId = r.item.id;
    }

    const formaPagamento = FORMAS_PAGAMENTO.includes(processada.formaPagamento as (typeof FORMAS_PAGAMENTO)[number])
      ? (processada.formaPagamento as (typeof FORMAS_PAGAMENTO)[number])
      : "OUTRO";

    await prisma.lancamento.create({
      data: {
        tipo: processada.tipo,
        valor: processada.valorCentavos,
        descricao: processada.descricao,
        dataCaixa: processada.dataCaixa ?? null,
        competenciaMes: (processada.dataCaixa ?? new Date()).getMonth() + 1,
        competenciaAno: (processada.dataCaixa ?? new Date()).getFullYear(),
        categoriaId,
        clienteId,
        formaPagamento,
        status: processada.dataCaixa ? "EFETIVADO" : "PREVISTO",
        origem: "IMPORTACAO",
        loteImportacaoId: loteId,
      },
    });
    importados++;
  }

  revalidatePath("/lancamentos");
  revalidatePath("/config/importar");
  revalidatePath("/");

  return { loteId, importados, ignorados, invalidos: detalhesInvalidos.length, detalhesInvalidos };
}

export type LoteImportado = { loteId: string; quantidade: number; criadoEm: Date };

export async function listarLotesImportados(): Promise<LoteImportado[]> {
  await exigirUsuario();

  const lancamentos = await prisma.lancamento.findMany({
    where: { origem: "IMPORTACAO", cancelado: false, loteImportacaoId: { not: null } },
    select: { loteImportacaoId: true, criadoEm: true },
  });

  const mapa = new Map<string, { quantidade: number; criadoEm: Date }>();
  for (const l of lancamentos) {
    if (!l.loteImportacaoId) continue;
    const atual = mapa.get(l.loteImportacaoId);
    if (atual) {
      atual.quantidade++;
      if (l.criadoEm < atual.criadoEm) atual.criadoEm = l.criadoEm;
    } else {
      mapa.set(l.loteImportacaoId, { quantidade: 1, criadoEm: l.criadoEm });
    }
  }

  return Array.from(mapa.entries())
    .map(([loteId, v]) => ({ loteId, ...v }))
    .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
}

export async function reverterLoteImportacao(loteId: string): Promise<{ quantidade: number }> {
  await exigirUsuario();

  const resultado = await prisma.lancamento.updateMany({
    where: { loteImportacaoId: loteId, origem: "IMPORTACAO", cancelado: false },
    data: { cancelado: true, status: "CANCELADO" },
  });

  revalidatePath("/lancamentos");
  revalidatePath("/config/importar");
  revalidatePath("/");

  return { quantidade: resultado.count };
}
