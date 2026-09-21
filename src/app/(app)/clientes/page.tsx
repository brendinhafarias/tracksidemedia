import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { agora } from "@/lib/data";
import { formatarBRL } from "@/lib/dinheiro";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormularioCliente } from "./formulario-cliente";
import { BotaoArquivarCliente } from "./botao-arquivar";

export default async function PaginaClientes() {
  const anoAtual = agora().getFullYear();
  const inicioAno = new Date(anoAtual, 0, 1);
  const fimAno = new Date(anoAtual + 1, 0, 1);

  const [clientes, totaisPorCliente, cobrancasPendentes] = await Promise.all([
    prisma.cliente.findMany({
      orderBy: [{ arquivado: "asc" }, { nome: "asc" }],
    }),
    prisma.lancamento.groupBy({
      by: ["clienteId"],
      where: {
        tipo: "ENTRADA",
        status: "EFETIVADO",
        clienteId: { not: null },
        dataCaixa: { gte: inicioAno, lt: fimAno },
      },
      _sum: { valor: true },
    }),
    prisma.cobranca.groupBy({
      by: ["clienteId", "status"],
      where: { status: { in: ["ABERTA", "PARCIAL"] } },
    }),
  ]);

  const totalPorClienteId = new Map(
    totaisPorCliente.map((t) => [t.clienteId as string, t._sum.valor ?? 0])
  );
  const pendenciaPorClienteId = new Set(cobrancasPendentes.map((c) => c.clienteId));

  function situacao(cliente: (typeof clientes)[number]) {
    if (cliente.tipo !== "MENSALISTA") return null;
    if (pendenciaPorClienteId.has(cliente.id)) {
      return <Badge variant="destructive">Em aberto</Badge>;
    }
    const temCobranca = totalPorClienteId.has(cliente.id);
    if (!temCobranca) return <Badge variant="outline">Sem cobrança</Badge>;
    return <Badge variant="secondary">Em dia</Badge>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <FormularioCliente />
      </div>

      {clientes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum cliente cadastrado ainda. Toque em &quot;Novo cliente&quot; para começar.
        </p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor mensal</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Total no ano</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((c) => (
                <TableRow key={c.id} className={c.arquivado ? "opacity-50" : undefined}>
                  <TableCell className="font-medium">
                    <Link href={`/clientes/${c.id}`} className="hover:underline">
                      {c.nome}
                    </Link>
                    {c.arquivado && (
                      <Badge variant="outline" className="ml-2">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.tipo === "MENSALISTA" ? "Mensalista" : "Avulso"}
                  </TableCell>
                  <TableCell>
                    {c.valorMensal != null ? formatarBRL(c.valorMensal) : "-"}
                  </TableCell>
                  <TableCell>{situacao(c) ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {formatarBRL(totalPorClienteId.get(c.id) ?? 0)}
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <FormularioCliente
                      cliente={c}
                      trigger={
                        <button className="text-sm underline underline-offset-2">
                          Editar
                        </button>
                      }
                    />
                    <BotaoArquivarCliente id={c.id} arquivado={c.arquivado} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
