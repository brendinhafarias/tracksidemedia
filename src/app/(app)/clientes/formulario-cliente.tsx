"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { criarCliente, atualizarCliente, type EstadoFormulario } from "./acoes";

type ClienteExistente = {
  id: string;
  nome: string;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  apelidos: string | null;
  tipo: "AVULSO" | "MENSALISTA";
  valorMensal: number | null;
  diaVencimento: number | null;
  observacoes: string | null;
};

export function FormularioCliente({
  cliente,
  trigger,
}: {
  cliente?: ClienteExistente;
  trigger?: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const acao = cliente ? atualizarCliente.bind(null, cliente.id) : criarCliente;
  const [estado, formAction, pendente] = useActionState<EstadoFormulario, FormData>(
    acao,
    null
  );
  const [tipo, setTipo] = useState<"AVULSO" | "MENSALISTA">(cliente?.tipo ?? "AVULSO");

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
            Novo cliente
          </Button>
        )}
      </span>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={cliente?.nome} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              items={{ AVULSO: "Avulso", MENSALISTA: "Mensalista" }}
              name="tipo"
              value={tipo}
              onValueChange={(v) => setTipo(v as typeof tipo)}
            >
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVULSO">Avulso</SelectItem>
                <SelectItem value="MENSALISTA">Mensalista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipo === "MENSALISTA" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="valorMensalTexto">Valor mensal (R$)</Label>
                <Input
                  id="valorMensalTexto"
                  name="valorMensalTexto"
                  placeholder="0,00"
                  defaultValue={
                    cliente?.valorMensal != null
                      ? (cliente.valorMensal / 100).toFixed(2).replace(".", ",")
                      : ""
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diaVencimento">Dia de vencimento</Label>
                <Input
                  id="diaVencimento"
                  name="diaVencimento"
                  type="number"
                  min={1}
                  max={28}
                  defaultValue={cliente?.diaVencimento ?? undefined}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" defaultValue={cliente?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" defaultValue={cliente?.telefone ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="documento">CPF/CNPJ</Label>
              <Input id="documento" name="documento" defaultValue={cliente?.documento ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apelidos">
                Apelidos <span className="text-muted-foreground">(p/ assistente)</span>
              </Label>
              <Input
                id="apelidos"
                name="apelidos"
                placeholder="separados por vírgula"
                defaultValue={cliente?.apelidos ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" name="observacoes" defaultValue={cliente?.observacoes ?? ""} />
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
