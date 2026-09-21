import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";
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
import { Button } from "@/components/ui/button";
import { FormularioUsuario } from "./formulario-usuario";
import { BotaoAtivoUsuario } from "./botao-ativo";

export default async function PaginaUsuarios() {
  const usuarioAtual = await obterUsuarioAtual();
  if (!usuarioAtual) redirect("/login");
  if (usuarioAtual.papel !== "ADMIN") redirect("/config");

  const usuarios = await prisma.usuario.findMany({ orderBy: [{ ativo: "desc" }, { nome: "asc" }] });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BotaoVoltar href="/config" />
        <h1 className="text-xl font-semibold flex-1">Usuários</h1>
        <FormularioUsuario />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id} className={!u.ativo ? "opacity-50" : undefined}>
                <TableCell className="font-medium">
                  {u.nome}
                  {!u.ativo && <Badge variant="outline" className="ml-2">Inativo</Badge>}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.papel === "ADMIN" ? "Admin" : "Operador"}</TableCell>
                <TableCell className="text-right space-x-1 whitespace-nowrap">
                  <FormularioUsuario
                    usuario={u}
                    trigger={<Button variant="outline" size="sm">Editar</Button>}
                  />
                  <BotaoAtivoUsuario id={u.id} ativo={u.ativo} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
