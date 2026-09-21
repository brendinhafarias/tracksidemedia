import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BotaoVoltar } from "@/components/botao-voltar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormularioCategoria } from "./formulario-categoria";
import { BotaoArquivarCategoria } from "./botao-arquivar";

export default async function PaginaCategorias() {
  const categorias = await prisma.categoria.findMany({
    orderBy: [{ arquivada: "asc" }, { tipo: "asc" }, { nome: "asc" }],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BotaoVoltar href="/config" />
        <h1 className="text-xl font-semibold flex-1">Categorias</h1>
        <FormularioCategoria />
      </div>

      {categorias.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma categoria cadastrada ainda.
        </p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-24">Cor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((c) => (
                <TableRow key={c.id} className={c.arquivada ? "opacity-50" : undefined}>
                  <TableCell className="font-medium">
                    {c.nome}
                    {c.arquivada && (
                      <Badge variant="outline" className="ml-2">Arquivada</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.tipo === "ENTRADA" ? "default" : "secondary"}>
                      {c.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-block size-5 rounded-full border"
                      style={{ backgroundColor: c.cor }}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <FormularioCategoria
                      categoria={c}
                      trigger={<Button variant="outline" size="sm">Editar</Button>}
                    />
                    <BotaoArquivarCategoria id={c.id} arquivada={c.arquivada} />
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
