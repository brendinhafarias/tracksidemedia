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
import { criarCategoria, atualizarCategoria, type EstadoFormulario } from "./acoes";

const CORES_SUGERIDAS = [
  "#16a34a", "#22c55e", "#0ea5e9", "#8b5cf6",
  "#f59e0b", "#dc2626", "#a855f7", "#64748b", "#94a3b8",
];

type CategoriaExistente = {
  id: string;
  nome: string;
  tipo: "ENTRADA" | "SAIDA";
  cor: string;
};

export function FormularioCategoria({
  categoria,
  trigger,
}: {
  categoria?: CategoriaExistente;
  trigger?: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const acao = categoria
    ? atualizarCategoria.bind(null, categoria.id)
    : criarCategoria;
  const [estado, formAction, pendente] = useActionState<EstadoFormulario, FormData>(
    acao,
    null
  );
  const [cor, setCor] = useState(categoria?.cor ?? "#64748b");

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
            Nova categoria
          </Button>
        )}
      </span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{categoria ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={categoria?.nome} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              items={{ ENTRADA: "Entrada", SAIDA: "Saída" }}
              name="tipo"
              defaultValue={categoria?.tipo ?? "SAIDA"}
            >
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRADA">Entrada</SelectItem>
                <SelectItem value="SAIDA">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <input type="hidden" name="cor" value={cor} />
            <div className="flex flex-wrap gap-2">
              {CORES_SUGERIDAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className="size-7 rounded-full border-2"
                  style={{
                    backgroundColor: c,
                    borderColor: cor === c ? "#000" : "transparent",
                  }}
                  aria-label={`Selecionar cor ${c}`}
                />
              ))}
            </div>
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
