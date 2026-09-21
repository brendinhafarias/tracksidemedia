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
import { BotaoVoltar } from "@/components/botao-voltar";
import { FormularioDespesa } from "./formulario-despesa";
import { BotaoAtivaDespesa } from "./botao-ativa";
import { BotaoGerarDespesas } from "./botao-gerar";

export default async function PaginaDespesasRecorrentes() {
  const hoje = agora();

  const [despesas, categorias] = await Promise.all([
    prisma.despesaRecorrente.findMany({
      include: { categoria: true },
      orderBy: [{ ativa: "desc" }, { descricao: "asc" }],
    }),
    prisma.categoria.findMany({ where: { tipo: "SAIDA", arquivada: false }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <BotaoVoltar href="/config" />
        <h1 className="text-xl font-semibold flex-1">Despesas recorrentes</h1>
        <BotaoGerarDespesas mes={hoje.getMonth() + 1} ano={hoje.getFullYear()} />
        <FormularioDespesa categorias={categorias} />
      </div>

      {despesas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma despesa recorrente cadastrada (aluguel, assinaturas, etc.).
          Cadastre uma para gerar os lançamentos previstos automaticamente
          todo mês.
        </p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Vencimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {despesas.map((d) => (
                <TableRow key={d.id} className={!d.ativa ? "opacity-50" : undefined}>
                  <TableCell className="font-medium">
                    {d.descricao}
                    {!d.ativa && <Badge variant="outline" className="ml-2">Inativa</Badge>}
                  </TableCell>
                  <TableCell>{d.categoria.nome}</TableCell>
                  <TableCell className="text-right">{formatarBRL(d.valor)}</TableCell>
                  <TableCell className="text-right">Dia {d.diaVencimento}</TableCell>
                  <TableCell className="text-right space-x-1 whitespace-nowrap">
                    <FormularioDespesa
                      despesa={d}
                      categorias={categorias}
                      trigger={<Badge className="cursor-pointer" variant="outline">Editar</Badge>}
                    />
                    <BotaoAtivaDespesa id={d.id} ativa={d.ativa} />
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
