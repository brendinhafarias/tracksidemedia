"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { criarUsuario, atualizarUsuario, type EstadoFormulario } from "./acoes";

type UsuarioExistente = { id: string; nome: string; email: string; papel: "ADMIN" | "OPERADOR" };

export function FormularioUsuario({
  usuario,
  trigger,
}: {
  usuario?: UsuarioExistente;
  trigger?: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const acao = usuario ? atualizarUsuario.bind(null, usuario.id) : criarUsuario;
  const [estado, formAction, pendente] = useActionState<EstadoFormulario, FormData>(acao, null);

  const [estadoProcessado, setEstadoProcessado] = useState(estado);
  if (estado !== estadoProcessado) {
    setEstadoProcessado(estado);
    if (estado?.sucesso) setAberto(false);
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <span className="contents" onClick={() => setAberto(true)}>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Novo usuário
          </Button>
        )}
      </span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{usuario ? "Editar usuário" : "Novo usuário"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={usuario?.nome} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={usuario?.email} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="papel">Perfil</Label>
            <Select
              items={{ OPERADOR: "Operador", ADMIN: "Admin" }}
              name="papel"
              defaultValue={usuario?.papel ?? "OPERADOR"}
            >
              <SelectTrigger id="papel" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPERADOR">Operador</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={usuario ? "novaSenha" : "senha"}>
              {usuario ? "Nova senha (opcional)" : "Senha"}
            </Label>
            <Input
              id={usuario ? "novaSenha" : "senha"}
              name={usuario ? "novaSenha" : "senha"}
              type="password"
              placeholder={usuario ? "Deixe em branco para manter a atual" : undefined}
              required={!usuario}
            />
          </div>
          {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
          <Button type="submit" className="w-full" disabled={pendente}>
            {pendente ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
