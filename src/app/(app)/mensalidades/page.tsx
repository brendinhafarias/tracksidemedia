import { prisma } from "@/lib/prisma";
import { agora } from "@/lib/data";
import { statusExibicaoCobranca } from "@/lib/cobrancas";
import { Card, CardContent } from "@/components/ui/card";
import { GradeMensalidades, type LinhaClienteMensalidade } from "./grade";
import { BotaoGerarMensalidades } from "./botao-gerar";
import { SeletorAno } from "./seletor-ano";
import type { DetalheCobranca } from "./painel-cobranca";

export default async function PaginaMensalidades({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const hoje = agora();
  const ano = params.ano ? Number(params.ano) : hoje.getFullYear();

  const clientes = await prisma.cliente.findMany({
    where: { tipo: "MENSALISTA", arquivado: false },
    orderBy: { nome: "asc" },
  });

  const cobrancas = await prisma.cobranca.findMany({
    where: {
      competenciaAno: ano,
      clienteId: { in: clientes.map((c) => c.id) },
      status: { not: "CANCELADA" },
    },
    include: {
      lancamentos: {
        where: { cancelado: false },
        orderBy: { dataCaixa: "asc" },
      },
    },
  });

  const cobrancaPorClienteMes = new Map(
    cobrancas.map((c) => [`${c.clienteId}-${c.competenciaMes}`, c])
  );

  const linhas: LinhaClienteMensalidade[] = clientes.map((cliente) => {
    let totalAno = 0;
    let devendo = false;

    const celulas = Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const cobranca = cobrancaPorClienteMes.get(`${cliente.id}-${mes}`);
      const statusExibicao = statusExibicaoCobranca(cobranca, hoje);
      const valorPago = cobranca
        ? cobranca.lancamentos
            .filter((l) => l.tipo === "ENTRADA" && l.status === "EFETIVADO")
            .reduce((soma, l) => soma + l.valor, 0)
        : 0;

      totalAno += valorPago;
      if (statusExibicao === "ABERTA" || statusExibicao === "PARCIAL" || statusExibicao === "ATRASADA") {
        devendo = true;
      }

      const detalhe: DetalheCobranca | null = cobranca
        ? {
            cobrancaId: cobranca.id,
            clienteNome: cliente.nome,
            mes,
            ano,
            valorDevido: cobranca.valorDevido,
            valorPago,
            dataVencimento: cobranca.dataVencimento,
            statusExibicao,
            lancamentos: cobranca.lancamentos
              .filter((l) => l.tipo === "ENTRADA" && l.status === "EFETIVADO")
              .map((l) => ({
                id: l.id,
                valor: l.valor,
                dataCaixa: l.dataCaixa,
                formaPagamento: l.formaPagamento,
              })),
          }
        : null;

      return { mes, statusExibicao, detalhe, valorPago };
    });

    return {
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      celulas,
      totalAno,
      devendo,
    };
  });

  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const mesAtualSemCobranca =
    ano === anoAtual &&
    clientes.length > 0 &&
    !cobrancas.some((c) => c.competenciaMes === mesAtual);

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => anoAtual - 2 + i);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold">Mensalidades</h1>
        <div className="flex items-center gap-2">
          <SeletorAno ano={ano} anos={anosDisponiveis} />
          <BotaoGerarMensalidades mes={mesAtual} ano={anoAtual} variant="outline" />
        </div>
      </div>

      {mesAtualSemCobranca && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="flex items-center justify-between gap-3 py-3 flex-wrap">
            <p className="text-sm">
              As mensalidades deste mês ainda não foram geradas.
            </p>
            <BotaoGerarMensalidades mes={mesAtual} ano={anoAtual} />
          </CardContent>
        </Card>
      )}

      <GradeMensalidades linhas={linhas} />
    </div>
  );
}
