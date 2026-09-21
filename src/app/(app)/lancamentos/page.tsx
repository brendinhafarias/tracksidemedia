import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obterRegime } from "@/lib/regime";
import { agora, nomeMes, ultimosMeses } from "@/lib/data";
import { FormularioLancamento } from "./formulario-lancamento";
import { FiltrosLancamentos } from "./filtros";
import { TabelaLancamentos } from "./tabela";
import { FabNovoLancamento } from "./fab";

export default async function PaginaLancamentos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const regime = await obterRegime();

  const [categorias, clientes] = await Promise.all([
    prisma.categoria.findMany({ where: { arquivada: false }, orderBy: { nome: "asc" } }),
    prisma.cliente.findMany({ where: { arquivado: false }, orderBy: { nome: "asc" } }),
  ]);

  const where: Prisma.LancamentoWhereInput = {};

  if (params.tipo === "ENTRADA" || params.tipo === "SAIDA") {
    where.tipo = params.tipo;
  }
  if (params.categoriaId) where.categoriaId = params.categoriaId;
  if (params.clienteId) where.clienteId = params.clienteId;
  if (params.formaPagamento) {
    where.formaPagamento = params.formaPagamento as Prisma.LancamentoWhereInput["formaPagamento"];
  }
  if (params.status) {
    where.status = params.status as Prisma.LancamentoWhereInput["status"];
  } else {
    // por padrão, oculta cancelados (aparecem só com o filtro explícito)
    where.status = { not: "CANCELADO" };
  }
  if (params.busca) {
    where.descricao = { contains: params.busca };
  }

  if (params.mes) {
    const [anoStr, mesStr] = params.mes.split("-");
    const ano = Number(anoStr);
    const mes = Number(mesStr);
    if (regime === "CAIXA") {
      where.dataCaixa = {
        gte: new Date(ano, mes - 1, 1),
        lt: new Date(ano, mes, 1),
      };
    } else {
      where.competenciaMes = mes;
      where.competenciaAno = ano;
    }
  }

  const lancamentos = await prisma.lancamento.findMany({
    where,
    include: { categoria: true, cliente: true },
    orderBy: [{ dataCaixa: "desc" }, { criadoEm: "desc" }],
    take: 200,
  });

  const hoje = agora();
  const opcoesMeses = ultimosMeses(24, {
    mes: hoje.getMonth() + 1,
    ano: hoje.getFullYear(),
  })
    .reverse()
    .map(({ mes, ano }) => ({
      valor: `${ano}-${String(mes).padStart(2, "0")}`,
      rotulo: `${nomeMes(mes)}/${ano}`,
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold">Lançamentos</h1>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <FormularioLancamento categorias={categorias} clientes={clientes} />
          </div>
        </div>
      </div>

      <FiltrosLancamentos categorias={categorias} clientes={clientes} meses={opcoesMeses} />

      <TabelaLancamentos lancamentos={lancamentos} categorias={categorias} clientes={clientes} />

      <FabNovoLancamento categorias={categorias} clientes={clientes} />
    </div>
  );
}
